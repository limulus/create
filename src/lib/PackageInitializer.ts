import copy from '@danieldietrich/copy'
import path from 'path'

import Package from './Package'
import {
  assertDirectoryIsGitRepository,
  assertGitRepositoryIsClean,
} from './GitRepository'

export default class PackageInitialzier {
  constructor (readonly pkg: Package) {}

  async initialize (directory: string): Promise<void> {
    await assertDirectoryIsGitRepository(directory)
    await assertGitRepositoryIsClean(directory)

    const src = path.resolve(__dirname, '..', '..', 'skel')
    await copy(src, directory)
  }
}
