import is from '@sindresorhus/is'
import Git from 'nodegit'

export default class GitRepository {
  #repo?: Git.Repository

  constructor (readonly directory: string) {}

  private async repo (): Promise<Git.Repository> {
    this.#repo = this.#repo ?? await Git.Repository.open(this.directory)
    return this.#repo
  }

  async isClean (): Promise<boolean> {
    const statuses = await this.statuses()
    const isDefaultState = await this.isDefaultState()
    return isDefaultState && statuses.length === 0
  }

  async isDefaultState (): Promise<boolean> {
    return (await this.repo()).isDefaultState()
  }

  async isDirty (): Promise<boolean> {
    return !(await this.isClean())
  }

  private async statuses (): Promise<Git.StatusFile[]> {
    return await (await this.repo()).getStatus()
  }
}

export async function assertDirectoryIsGitRepository (directory: string): Promise<void> {
  try {
    await new GitRepository(directory).isDefaultState()
  } catch (err: unknown) {
    if (is.error(err) && err.message.includes('could not find repository')) {
      throw new Error(`${directory}: must be a git repository`)
    }
    throw err
  }
}

export async function assertGitRepositoryIsClean (directory: string): Promise<void> {
  const repository = new GitRepository(directory)
  if (await repository.isDirty()) {
    throw new Error(`${directory}: must be clean`)
  }
}
