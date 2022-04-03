import copy from '@danieldietrich/copy'
import mustache from 'mustache'
import path from 'path'

import { assertDirectoryIsGitRepository, assertGitRepositoryIsClean } from './GitRepository'
import Package from './Package'

export default class PackageInitialzier {
  constructor(readonly pkg: Package) {}

  async initialize(directory: string): Promise<void> {
    await assertDirectoryIsGitRepository(directory)
    await assertGitRepositoryIsClean(directory)

    const src = path.resolve(__dirname, '..', '..', 'skel')
    await copy(src, directory, {
      rename: (_source, target) => this.rename(target.path),
      transform: (data, source) => this.transform(data, source.path),
    })
  }

  private rename(path: string): string | undefined {
    if (path.endsWith('.mustache')) {
      return path.replace(/\.mustache$/, '')
    }
    return undefined
  }

  private transform(data: Buffer, path: string): Buffer {
    if (path.endsWith('.mustache')) {
      return Buffer.from(mustache.render(data.toString(), { package: this.pkg }))
    } else {
      return data
    }
  }
}
