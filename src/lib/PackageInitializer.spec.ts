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
    describe.each(['tsconfig.json', 'src/index.ts'])('skel/%s', (file) => {
      it('should be copied into the repo', async () => {
        const skelFilePath = path.join(__dirname, '..', '..', 'skel', file)
        const destFilePath = path.join(directory, file)
        expect(fs.existsSync(skelFilePath)).toBe(true)
        expect(fs.existsSync(destFilePath)).toBe(false)

        const initializer = new PackageInitializer(pkg)
        await initializer.initialize(directory)
        expect(fs.existsSync(destFilePath)).toBe(true)
      })
    })

    describe.each(['README.md.mustache', '.gitignore.mustache'])('skel/%s', (file) => {
      it('should be copied into the repo without .gitignore extension', async () => {
        const skelFilePath = path.join(__dirname, '..', '..', 'skel', file)
        const destFilePath = path.join(directory, file.replace(/\.mustache$/, ''))
        expect(fs.existsSync(skelFilePath)).toBe(true)
        expect(fs.existsSync(destFilePath)).toBe(false)

        const initializer = new PackageInitializer(pkg)
        await initializer.initialize(directory)
        expect(fs.existsSync(destFilePath)).toBe(true)
      })
    })

    it('should hydrate templates with info from given Package object', async () => {
      const packageJsonDest = path.join(directory, 'package.json')
      const initializer = new PackageInitializer(pkg)
      await initializer.initialize(directory)
      expect(fs.readFileSync(packageJsonDest).toString()).toMatch(
        /"name":\s*"@limulus\/zuul"/
      )
    })
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
