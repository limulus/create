import copy from '@danieldietrich/copy'
import mustache from 'mustache'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  assertDirectoryIsGitRepository,
  assertGitRepositoryIsClean,
} from './GitRepository.ts'
import Package from './Package.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default class PackageInitializier {
  readonly pkg: Package

  constructor(pkg: Package) {
    this.pkg = pkg
  }

  async initialize(directory: string): Promise<void> {
    await assertDirectoryIsGitRepository(directory)
    await assertGitRepositoryIsClean(directory)

    const src = path.resolve(__dirname, '..', '..', 'skel')
    await copy(src, directory, {
      filter: (source) => this.include(path.relative(src, source.path)),
      rename: (_source, target) => this.rename(target.path),
      transform: (data, source) => this.transform(data, source.path),
    })
  }

  private include(relativePath: string): boolean {
    if (relativePath === 'LICENSE.mustache') {
      return !this.pkg.isPrivate
    }
    return true
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
