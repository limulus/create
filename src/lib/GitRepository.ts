import is from '@sindresorhus/is'
import hostedGitInfo from 'hosted-git-info'
import { type SimpleGit, simpleGit } from 'simple-git'

export interface GitHubRepository {
  owner: string
  repo: string
}

export interface GitAuthor {
  name: string
  email?: string
}

/**
 * The repository lacks a piece of information `create` needs: an `origin` remote on
 * GitHub, or a `user.name` in git config. Callers catch this to suggest supplying the
 * value by hand.
 */
export class MissingGitInfoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingGitInfoError'
  }
}

export default class GitRepository {
  readonly directory: string
  readonly repo: SimpleGit

  constructor(directory: string) {
    this.directory = directory
    this.repo = simpleGit(directory)
  }

  async isClean(): Promise<boolean> {
    const status = await this.repo.status()
    return status.isClean()
  }

  async isDirty(): Promise<boolean> {
    return !(await this.isClean())
  }

  /**
   * Accepts any URL form GitHub hands out for `origin` (HTTPS with or without `.git`, SSH,
   * `ssh://`), and throws `MissingGitInfoError` when there is no `origin` or it is not a
   * full GitHub URL.
   */
  async githubRepository(): Promise<GitHubRepository> {
    await assertDirectoryIsGitRepository(this.directory)
    const origin = (await this.repo.getRemotes(true)).find(
      (remote) => remote.name === 'origin'
    )
    if (origin === undefined) {
      throw new MissingGitInfoError(`remote 'origin' does not exist`)
    }

    const info = hostedGitInfo.fromUrl(origin.refs.fetch)
    // hosted-git-info also reads `owner/repo` and `github:owner/repo` as GitHub shorthand,
    // but as an `origin` the former is a relative local path, not a GitHub repository.
    if (info?.type !== 'github' || info.default === 'shortcut') {
      throw new MissingGitInfoError(`origin url "${origin.refs.fetch}" is not a GitHub URL`)
    }
    return { owner: info.user, repo: info.project }
  }

  /**
   * Reads `user.name` and `user.email` from git config as git itself would for a commit
   * in this repository. Throws `MissingGitInfoError` when `user.name` is not set.
   */
  async author(): Promise<GitAuthor> {
    const name = await this.configValue('user.name')
    if (name === undefined) {
      throw new MissingGitInfoError('git config user.name is not set')
    }
    const email = await this.configValue('user.email')
    return email === undefined ? { name } : { name, email }
  }

  private async configValue(key: string): Promise<string | undefined> {
    const value = (await this.repo.getConfig(key)).value?.trim()
    return value === undefined || value === '' ? undefined : value
  }
}

export async function assertDirectoryIsGitRepository(directory: string): Promise<void> {
  try {
    await simpleGit(directory).status()
  } catch (err: unknown) {
    if (is.error(err) && err.message.includes('not a git repository')) {
      throw new Error(`${directory}: must be a git repository`)
    }
    throw err
  }
}

export async function assertGitRepositoryIsClean(directory: string): Promise<void> {
  const repository = new GitRepository(directory)
  if (await repository.isDirty()) {
    throw new Error(`${directory}: must be clean`)
  }
}
