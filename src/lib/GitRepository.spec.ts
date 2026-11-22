import { deleteSync } from 'del'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { temporaryDirectory } from 'tempy'
import touch from 'touch'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import GitRepository, {
  assertDirectoryIsGitRepository,
  assertGitRepositoryIsClean,
  MissingGitInfoError,
} from './GitRepository.ts'

let directory: string

beforeEach(async () => {
  directory = createTempGitRepo()
})

afterEach(() => vi.restoreAllMocks())

describe('GitRepository', () => {
  describe('.isClean()', () => {
    it('should return true when git repository is clean', async () => {
      const repository = new GitRepository(directory)
      expect(await repository.isClean()).toBe(true)
    })

    it('should return false when git repo is not in default state', async () => {
      finanlgeRepoIntoMergeState(directory)
      const repository = new GitRepository(directory)
      expect(await repository.isClean()).toBe(false)
    })

    it('should return false when git repository is dirty', async () => {
      addFileToDirectory(directory)
      const repository = new GitRepository(directory)
      expect(await repository.isClean()).toBe(false)
    })
  })

  describe('.githubRepository()', () => {
    it('should throw MissingGitInfoError when the origin remote is not set', async () => {
      const repository = new GitRepository(directory)
      const lookup = repository.githubRepository()
      await expect(lookup).rejects.toThrow(MissingGitInfoError)
      await expect(lookup).rejects.toThrow(/remote 'origin' does not exist/i)
    })

    it.each([
      'https://example.com/foo/bar.git',
      'https://gitlab.com/foo/bar.git',
      'foo/bar',
      'github:foo/bar',
    ])('should throw MissingGitInfoError if origin is %s', async (url) => {
      const repository = new GitRepository(directory)
      setOriginRemote(directory, url)
      const lookup = repository.githubRepository()
      await expect(lookup).rejects.toThrow(MissingGitInfoError)
      await expect(lookup).rejects.toThrow(`origin url "${url}" is not a GitHub URL`)
    })

    it.each([
      'https://github.com/some-owner/some.repo.git',
      'https://github.com/some-owner/some.repo',
      'git@github.com:some-owner/some.repo.git',
      'ssh://git@github.com/some-owner/some.repo.git',
    ])('should return the owner and repository of %s', async (url) => {
      const repository = new GitRepository(directory)
      setOriginRemote(directory, url)
      expect(await repository.githubRepository()).toEqual({
        owner: 'some-owner',
        repo: 'some.repo',
      })
    })

    it('should throw a plain error when the directory is not a git repository', async () => {
      const repository = new GitRepository(directory)
      removeDotGitDirectory(directory)
      const lookup = repository.githubRepository()
      await expect(lookup).rejects.toThrow(/must be a git repository/)
      await expect(lookup).rejects.not.toThrow(MissingGitInfoError)
    })
  })

  describe('.author()', () => {
    beforeEach(() => {
      // Hide the machine's own global config, so only this repository's counts. simple-git
      // drops ambient GIT_* variables such as GIT_CONFIG_GLOBAL, so move HOME instead.
      const home = temporaryDirectory()
      vi.stubEnv('HOME', home)
      vi.stubEnv('XDG_CONFIG_HOME', home)
    })

    afterEach(() => vi.unstubAllEnvs())

    it('should return user.name and user.email from git config', async () => {
      setConfig(directory, 'user.name', 'Jane Doe')
      setConfig(directory, 'user.email', 'jane@example.com')
      const repository = new GitRepository(directory)
      expect(await repository.author()).toEqual({
        name: 'Jane Doe',
        email: 'jane@example.com',
      })
    })

    it('should leave out the email when user.email is not set', async () => {
      setConfig(directory, 'user.name', 'Jane Doe')
      const repository = new GitRepository(directory)
      expect(await repository.author()).toEqual({ name: 'Jane Doe' })
    })

    it('should leave out the email when user.email is blank', async () => {
      setConfig(directory, 'user.name', 'Jane Doe')
      setConfig(directory, 'user.email', ' ')
      const repository = new GitRepository(directory)
      expect(await repository.author()).toEqual({ name: 'Jane Doe' })
    })

    it.each([
      ['not set', undefined],
      ['blank', ''],
    ])('should throw MissingGitInfoError when user.name is %s', async (_label, value) => {
      if (value !== undefined) setConfig(directory, 'user.name', value)
      const repository = new GitRepository(directory)
      const lookup = repository.author()
      await expect(lookup).rejects.toThrow(MissingGitInfoError)
      await expect(lookup).rejects.toThrow('git config user.name is not set')
    })
  })
})

describe('assertDirectoryIsGitRepository()', () => {
  describe('when given directory is a valid git repo', () => {
    it('should not throw', async () => {
      await expect(assertDirectoryIsGitRepository(directory)).resolves.not.toThrow()
    })
  })

  describe('when given directory is not a git repo', () => {
    beforeEach(() => {
      removeDotGitDirectory(directory)
    })

    it('should throw', async () => {
      await expect(assertDirectoryIsGitRepository(directory)).rejects.toThrow(
        /must be a git repo/
      )
    })
  })

  describe('when git throws some other error', () => {
    it('should re-throw the error', async () => {
      await expect(assertDirectoryIsGitRepository('./nonexistent')).rejects.toThrow()
    })
  })
})

describe('assertGitRepositoryIsClean()', () => {
  describe('when given directory is clean', () => {
    it('should not throw', async () => {
      await expect(assertGitRepositoryIsClean(directory)).resolves.not.toThrow()
    })
  })

  describe('when given directory is dirty', () => {
    beforeEach(() => {
      addFileToDirectory(directory)
    })

    it('should throw', async () => {
      await expect(assertGitRepositoryIsClean(directory)).rejects.toThrow(/clean/)
    })
  })
})

const addFileToDirectory = (directory: string): void => {
  touch.sync(path.join(directory, 'foo.txt'))
}

const createTempGitRepo = (): string => {
  const directory = temporaryDirectory()
  execFileSync('git', ['init', directory], { env: gitlessEnv(), stdio: 'pipe' })
  const execGit = makeExecGit(directory)
  execGit('checkout', '-b', 'main')
  return directory
}

const setOriginRemote = (directory: string, url: string): void => {
  const execGit = makeExecGit(directory)
  execGit('remote', 'add', 'origin', url)
}

const setConfig = (directory: string, key: string, value: string): void => {
  const execGit = makeExecGit(directory)
  execGit('config', key, value)
}

const finanlgeRepoIntoMergeState = (directory: string): void => {
  const execGit = makeExecGit(directory)
  const fooTxtPath = path.join(directory, 'foo.txt')

  fs.writeFileSync(fooTxtPath, 'foo\n')
  execGit('add', 'foo.txt')
  execGit('commit', '-m', 'First commit on main')
  execGit('checkout', '-b', 'new-branch')
  fs.writeFileSync(fooTxtPath, 'bar\n')
  execGit('add', 'foo.txt')
  execGit('commit', '-m', 'First commit on new-branch')
  execGit('checkout', 'main')
  fs.writeFileSync(fooTxtPath, 'baz\n')
  execGit('add', 'foo.txt')
  execGit('commit', '-m', 'Second commit on main')

  try {
    execGit('merge', 'new-branch')
  } catch {
    // continue
  }
}

const makeExecGit =
  (directory: string) =>
  (...args: string[]) =>
    execFileSync('git', args, { cwd: directory, stdio: 'pipe', env: gitlessEnv() })

const gitlessEnv = () =>
  Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')))

const removeDotGitDirectory = (directory: string): void => {
  deleteSync(path.join(directory, '.git'), { force: true })
}
