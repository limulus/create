import { jest } from '@jest/globals'
import { execFileSync } from 'child_process'
import { deleteSync } from 'del'
import fs from 'fs'
import path from 'path'
import { temporaryDirectory } from 'tempy'
import touch from 'touch'

import GitRepository, {
  assertDirectoryIsGitRepository,
  assertGitRepositoryIsClean,
} from './GitRepository.js'

let directory: string

beforeEach(async () => {
  directory = await createTempGitRepo()
})

afterEach(() => jest.restoreAllMocks())

describe('GitRepository', () => {
  describe('.isDefaultState()', () => {
    it('should return true when repository is in default state', async () => {
      const repository = new GitRepository(directory)
      expect(await repository.isDefaultState()).toBe(true)
    })

    it('should return false when repository is in non-default state', async () => {
      finanlgeRepoIntoMergeState(directory)
      const repository = new GitRepository(directory)
      expect(await repository.isDefaultState()).toBe(false)
    })
  })

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

  describe('.githubOwner()', () => {
    it('should throw when orgin remote is not set', async () => {
      const repository = new GitRepository(directory)
      await expect(async () => await repository.githubOwner()).rejects.toThrow(
        /remote 'origin' does not exist/i
      )
    })

    it('should throw if origin is not a GitHub URL', async () => {
      const repository = new GitRepository(directory)
      setOriginRemote(directory, 'https://example.com/foo/bar.git')
      await expect(async () => await repository.githubOwner()).rejects.toThrow(
        /not a github url/i
      )
    })

    it('should return the owner of the GitHub repo', async () => {
      const repository = new GitRepository(directory)
      setOriginRemote(directory, 'https://github.com/unallocate/nonexist.git')
      expect(await repository.githubOwner()).toBe('unallocate')
    })
  })

  describe('.githubRepoName()', () => {
    it('should throw when orgin remote is not set', async () => {
      const repository = new GitRepository(directory)
      await expect(async () => await repository.githubRepoName()).rejects.toThrow(
        /remote 'origin' does not exist/i
      )
    })

    it('should throw if origin is not a GitHub URL', async () => {
      const repository = new GitRepository(directory)
      setOriginRemote(directory, 'https://example.com/foo/bar.git')
      await expect(async () => await repository.githubRepoName()).rejects.toThrow(
        /not a github url/i
      )
    })

    it('should return the GitHub repo name', async () => {
      const repository = new GitRepository(directory)
      setOriginRemote(directory, 'https://github.com/unallocate/nonexist.git')
      expect(await repository.githubRepoName()).toBe('nonexist')
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
    beforeEach(() => removeDotGitDirectory(directory))

    it('should throw', async () => {
      await expect(assertDirectoryIsGitRepository(directory)).rejects.toThrow(
        /must be a git repo/
      )
    })
  })

  describe('when nodegit throws some other error', () => {
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
    beforeEach(() => addFileToDirectory(directory))

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
  execFileSync('git', ['init', directory], { env: gitlessEnv() })
  const execGit = makeExecGit(directory)
  execGit('checkout', '-b', 'main')
  return directory
}

const setOriginRemote = (directory: string, url: string): void => {
  const execGit = makeExecGit(directory)
  execGit('remote', 'add', 'origin', url)
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
