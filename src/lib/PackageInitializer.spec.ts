import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import tempy from 'tempy'

import Package from './Package'
import PackageInitializer from './PackageInitializer'

describe('PackageInitializer', () => {
  let pkg: Package
  let directory: string

  beforeEach(() => {
    pkg = makePackage()
    directory = makeGitRepo()
  })

  describe('.initialize()', () => {
    it('should contain files copied from skel', async () => {
      const tsConfigSrc = path.join(__dirname, '..', '..', 'skel', 'tsconfig.json')
      const tsConfigDest = path.join(directory, 'tsconfig.json')
      expect(fs.existsSync(tsConfigSrc)).toBe(true)
      expect(fs.existsSync(tsConfigDest)).toBe(false)

      const initializer = new PackageInitializer(pkg)
      await initializer.initialize(directory)
      expect(fs.existsSync(tsConfigDest)).toBe(true)
    })

    it('should remove .mustache extension on template files', async () => {
      const readmeSrc = path.join(__dirname, '..', '..', 'skel', 'README.md.mustache')
      const readmeDest = path.join(directory, 'README.md')
      expect(fs.existsSync(readmeSrc)).toBe(true)
      expect(fs.existsSync(readmeDest)).toBe(false)

      const initializer = new PackageInitializer(pkg)
      await initializer.initialize(directory)
      expect(fs.existsSync(readmeDest)).toBe(true)
    })

    it.todo('should hydrate templates with info from given Package object')
  })
})

const makePackage = (): Package => {
  return new Package({ name: '@limulus/zuul', description: 'There is only zuul' })
}

const makeGitRepo = (): string => {
  const directory = tempy.directory()
  execFileSync('git', ['init', directory])
  return directory
}
