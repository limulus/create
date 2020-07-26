import del from 'del'
import Git from 'nodegit'
import path from 'path'
import tempy from 'tempy'
import touch from 'touch'

import GitRepository, {
  assertDirectoryIsGitRepository,
  assertGitRepositoryIsClean,
} from './GitRepository'

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
      fakeNonDefaultState()
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
      fakeNonDefaultState()
      const repository = new GitRepository(directory)
      expect(await repository.isClean()).toBe(false)
    })

    it('should return false when git repository is dirty', async () => {
      addFileToDirectory(directory)
      const repository = new GitRepository(directory)
      expect(await repository.isClean()).toBe(false)
    })
  })
})

describe('assertDirectoryIsGitRepository()', () => {
  describe('when given directory is a valid git repo', () => {
    it('should not throw', async () => {
      await expect(assertDirectoryIsGitRepository(directory))
        .resolves.not.toThrow()
    })
  })

  describe('when given directory is not a git repo', () => {
    beforeEach(() => removeDotGitDirectory(directory))

    it('should throw', async () => {
      await expect(assertDirectoryIsGitRepository(directory))
        .rejects.toThrow(/must be a git repo/)
    })
  })
})

describe('assertGitRepositoryIsClean()', () => {
  describe('when given directory is clean', () => {
    it('should not throw', async () => {
      await expect(assertGitRepositoryIsClean(directory))
        .resolves.not.toThrow()
    })
  })

  describe('when given directory is dirty', () => {
    beforeEach(() => addFileToDirectory(directory))

    it('should throw', async () => {
      await expect(assertGitRepositoryIsClean(directory))
        .rejects.toThrow(/clean/)
    })
  })
})

const addFileToDirectory = (directory: string): void => {
  touch.sync(path.join(directory, 'foo.txt'))
}

const createTempGitRepo = async (): Promise<string> => {
  const directory = tempy.directory()
  await Git.Repository.init(directory, 0)
  return directory
}

const fakeNonDefaultState = (): void => {
  jest.spyOn(Git.Repository.prototype, 'isDefaultState').mockReturnValue(false)
}

const removeDotGitDirectory = (directory: string): void => {
  del.sync(path.join(directory, '.git'), { force: true })
}
