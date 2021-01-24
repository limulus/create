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
    const files = ['tsconfig.json', 'src/index.ts', '.gitignore']

    describe.each(files)('skel/%s', (file) => {
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

    it('should remove .mustache extension on template files', async () => {
      const readmeSrc = path.join(__dirname, '..', '..', 'skel', 'README.md.mustache')
      const readmeDest = path.join(directory, 'README.md')
      expect(fs.existsSync(readmeSrc)).toBe(true)
      expect(fs.existsSync(readmeDest)).toBe(false)

      const initializer = new PackageInitializer(pkg)
      await initializer.initialize(directory)
      expect(fs.existsSync(readmeDest)).toBe(true)
    })

    it('should hydrate templates with info from given Package object', async () => {
      const packageJsonDest = path.join(directory, 'package.json')
      const initializer = new PackageInitializer(pkg)
      await initializer.initialize(directory)
      expect(fs.readFileSync(packageJsonDest).toString()).toMatch(/"name":\s*"@limulus\/zuul"/)
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
