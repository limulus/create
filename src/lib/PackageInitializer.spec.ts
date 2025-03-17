import { execFileSync } from 'child_process'
import fs from 'fs'
import path, { dirname } from 'path'
import { temporaryDirectory } from 'tempy'
import { fileURLToPath } from 'url'
import { describe, it, expect, beforeEach } from 'vitest'

import Package from './Package.js'
import PackageInitializer from './PackageInitializer.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('PackageInitializer', () => {
  let pkg: Package
  let directory: string

  beforeEach(() => {
    pkg = makePackage()
    directory = makeGitRepo()
  })

  describe('.initialize()', () => {
    describe.each(['src/index.ts'])('skel/%s', (file) => {
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

    describe.each(['README.md.mustache', '.gitignore.mustache', 'tsconfig.json.mustache'])(
      'skel/%s',
      (file) => {
        it('should be copied into the repo without .gitignore extension', async () => {
          const skelFilePath = path.join(__dirname, '..', '..', 'skel', file)
          const destFilePath = path.join(directory, file.replace(/\.mustache$/, ''))
          expect(fs.existsSync(skelFilePath)).toBe(true)
          expect(fs.existsSync(destFilePath)).toBe(false)

          const initializer = new PackageInitializer(pkg)
          await initializer.initialize(directory)
          expect(fs.existsSync(destFilePath)).toBe(true)
        })
      }
    )

    it('should hydrate templates with info from given Package object', async () => {
      const packageJsonDest = path.join(directory, 'package.json')
      const initializer = new PackageInitializer(pkg)
      await initializer.initialize(directory)
      expect(fs.readFileSync(packageJsonDest).toString()).toMatch(
        /"name":\s*"@limulus\/zuul"/
      )
    })

    it('should apply node moduleConfig to tsconfig.json when target is node', async () => {
      const tsConfigDest = path.join(directory, 'tsconfig.json')
      const initializer = new PackageInitializer(
        new Package({ name: '@test/pkg', description: 'Test', target: 'node' })
      )
      await initializer.initialize(directory)
      const tsConfig = fs.readFileSync(tsConfigDest).toString()
      expect(tsConfig).toMatch(/"module":\s*"NodeNext"/)
      expect(tsConfig).toMatch(/"moduleResolution":\s*"nodenext"/)
      expect(tsConfig).toMatch(/"types":\s*\["node"\]/)
    })

    it('should apply web moduleConfig to tsconfig.json when target is web', async () => {
      const tsConfigDest = path.join(directory, 'tsconfig.json')
      const initializer = new PackageInitializer(
        new Package({ name: '@test/pkg', description: 'Test', target: 'web' })
      )
      await initializer.initialize(directory)
      const tsConfig = fs.readFileSync(tsConfigDest).toString()
      expect(tsConfig).toMatch(/"module":\s*"ESNext"/)
      expect(tsConfig).toMatch(/"moduleResolution":\s*"bundler"/)
      expect(tsConfig).not.toMatch(/"types"/)
    })
  })
})

const makePackage = (): Package => {
  return new Package({ name: '@limulus/zuul', description: 'There is only zuul' })
}

const makeGitRepo = (): string => {
  const directory = temporaryDirectory()
  execFileSync('git', ['init', directory])
  return directory
}
