import is from '@sindresorhus/is'
import { type SimpleGit, simpleGit, type RemoteWithRefs } from 'simple-git'

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

  async githubOwner(): Promise<string> {
    const originRemote = await this.originRemote()
    return githubOriginUrlInfo(originRemote).owner
  }

  async githubRepoName(): Promise<string> {
    const originRemote = await this.originRemote()
    return githubOriginUrlInfo(originRemote).repo
  }

  private async originRemote() {
    const origin = (await this.repo.getRemotes(true)).find(
      (remote) => remote.name === 'origin'
    )
    if (origin === undefined) {
      throw new Error(`remote 'origin' does not exist`)
    }
    return origin
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

function githubOriginUrlInfo(originRemote: RemoteWithRefs): {
  owner: string
  repo: string
} {
  const githubUrlRe = /^https:\/\/github.com\/([\w-]+)\/([\w-]+)\.git$/
  const githubUrlInfo = originRemote.refs.fetch.match(githubUrlRe)
  if (githubUrlInfo === null) {
    throw new Error(`origin url "${originRemote.refs.fetch}" is not a GitHub URL`)
  }
  return { owner: githubUrlInfo[1], repo: githubUrlInfo[2] }
}
