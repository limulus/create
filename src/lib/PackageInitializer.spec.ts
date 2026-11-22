import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { temporaryDirectory } from 'tempy'
import { describe, it, expect, beforeEach } from 'vitest'

import Package from './Package.ts'
import PackageInitializer from './PackageInitializer.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('PackageInitializer', () => {
  let pkg: Package
  let directory: string

  beforeEach(() => {
    pkg = makePackage()
    directory = makeGitRepo()
  })

  describe('.initialize()', () => {
    describe.each([
      'src/index.ts',
      'src/lib/example.ts',
      'tsconfig.json',
      'tsconfig.build.json',
      '.releaserc.json',
    ])('skel/%s', (file) => {
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

    describe.each([
      'AGENTS.md.mustache',
      'README.md.mustache',
      '.gitignore.mustache',
      'tsconfig.base.json.mustache',
    ])('skel/%s', (file) => {
      it('should be copied into the repo without .mustache extension', async () => {
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

    it('should build GitHub URLs from the package’s GitHub owner and repository', async () => {
      const initializer = new PackageInitializer(
        new Package({ ...packageOptions, github: { owner: 'some-org', repo: 'gozer' } })
      )
      await initializer.initialize(directory)
      const packageJson = readPackageJson(directory)
      expect(packageJson.repository.url).toBe('git+https://github.com/some-org/gozer.git')
      expect(packageJson.bugs.url).toBe('https://github.com/some-org/gozer/issues')
      expect(packageJson.homepage).toBe('https://github.com/some-org/gozer#readme')
    })

    it('should write the package’s author into package.json', async () => {
      const author = { name: 'Dana "Zuul" Barrett', email: 'dana@example.com' }
      const initializer = new PackageInitializer(new Package({ ...packageOptions, author }))
      await initializer.initialize(directory)
      expect(readPackageJson(directory).author).toEqual(author)
    })

    describe('when the package is private', () => {
      beforeEach(async () => {
        await new PackageInitializer(pkg).initialize(directory)
      })

      it('should mark package.json UNLICENSED', () => {
        expect(readPackageJson(directory).license).toBe('UNLICENSED')
      })

      it('should publish to GitHub Packages without setting access', () => {
        expect(readPackageJson(directory).publishConfig).toEqual({
          registry: 'https://npm.pkg.github.com',
        })
      })

      it('should publish from CI with GITHUB_TOKEN', () => {
        expect(readWorkflow(directory)).toContain('NPM_TOKEN: ${{ secrets.GITHUB_TOKEN }}')
      })

      it('should not create a LICENSE file', () => {
        expect(fs.existsSync(path.join(directory, 'LICENSE'))).toBe(false)
        expect(fs.existsSync(path.join(directory, 'LICENSE.mustache'))).toBe(false)
      })
    })

    describe.each([
      ['a public scoped', '@limulus/zuul', true],
      ['an unscoped', 'zuul', false],
    ])('when the package is %s package', (_label, name, isPublic) => {
      beforeEach(async () => {
        const publicPkg = new Package({ ...packageOptions, name, public: isPublic })
        await new PackageInitializer(publicPkg).initialize(directory)
      })

      it('should mark package.json MIT', () => {
        expect(readPackageJson(directory).license).toBe('MIT')
      })

      it('should publish publicly to the npm registry', () => {
        expect(readPackageJson(directory).publishConfig).toEqual({
          registry: 'https://registry.npmjs.org',
          access: 'public',
        })
      })

      it('should publish from CI with NPM_TOKEN', () => {
        expect(readWorkflow(directory)).toContain('NPM_TOKEN: ${{ secrets.NPM_TOKEN }}')
      })

      it('should create an MIT LICENSE file for the current year and the author', () => {
        const license = fs.readFileSync(path.join(directory, 'LICENSE'), 'utf8')
        expect(license).toMatch(/^MIT License\n/)
        expect(license).toContain(`Copyright (c) ${new Date().getFullYear()} Ivo Shandor\n`)
      })
    })

    describe.each([
      ['private', false],
      ['public', true],
    ])('when the package is %s', (_label, isPublic) => {
      beforeEach(async () => {
        const anyPkg = new Package({
          name: '@limulus/zuul',
          description: 'Zuul',
          public: isPublic,
        })
        await new PackageInitializer(anyPkg).initialize(directory)
      })

      it('should not create an .npmrc', () => {
        expect(fs.existsSync(path.join(directory, '.npmrc'))).toBe(false)
      })

      it('should not pass a GitHub Packages read token to CI', () => {
        expect(readWorkflow(directory)).not.toContain('GPR_READ_TOKEN')
      })

      it('should analyze commits and write release notes with the conventionalcommits preset', () => {
        const releaserc = JSON.parse(
          fs.readFileSync(path.join(directory, '.releaserc.json'), 'utf8')
        ) as { plugins: unknown[] }
        expect(releaserc.plugins).toEqual(
          expect.arrayContaining([
            ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
            [
              '@semantic-release/release-notes-generator',
              { preset: 'conventionalcommits' },
            ],
          ])
        )
      })

      // The pair is pinned because preset major 10 breaks release-notes-generator under
      // semantic-release 25; raise both together after a dry-run proves the new pair.
      it('should install the compatible conventionalcommits preset beside semantic-release in CI', () => {
        expect(readWorkflow(directory)).toContain(
          'npx --yes -p semantic-release@25 -p conventional-changelog-conventionalcommits@9 semantic-release\n'
        )
      })
    })

    it('should apply node moduleConfig to tsconfig.base.json when target is node', async () => {
      const tsConfigDest = path.join(directory, 'tsconfig.base.json')
      const initializer = new PackageInitializer(
        new Package({ ...packageOptions, name: '@test/pkg', target: 'node' })
      )
      await initializer.initialize(directory)
      const tsConfig = fs.readFileSync(tsConfigDest).toString()
      expect(tsConfig).toMatch(/"module":\s*"NodeNext"/)
      expect(tsConfig).toMatch(/"moduleResolution":\s*"nodenext"/)
      expect(tsConfig).toMatch(/"types":\s*\["node"\]/)
    })

    it('should apply web moduleConfig to tsconfig.base.json when target is web', async () => {
      const tsConfigDest = path.join(directory, 'tsconfig.base.json')
      const initializer = new PackageInitializer(
        new Package({ ...packageOptions, name: '@test/pkg', target: 'web' })
      )
      await initializer.initialize(directory)
      const tsConfig = fs.readFileSync(tsConfigDest).toString()
      expect(tsConfig).toMatch(/"module":\s*"ESNext"/)
      expect(tsConfig).toMatch(/"moduleResolution":\s*"bundler"/)
      expect(tsConfig).not.toMatch(/"types"/)
    })

    it('should fail when repository has uncommitted changes', async () => {
      // Create a file in the repo to make it dirty
      const existingFile = path.join(directory, 'existing.txt')
      fs.writeFileSync(existingFile, 'existing content')

      const initializer = new PackageInitializer(pkg)
      await expect(initializer.initialize(directory)).rejects.toThrow(/must be clean/)
    })

    it('should succeed and overwrite files when repository has committed files', async () => {
      // Create and commit a file that will be overwritten
      const existingFile = path.join(directory, 'README.md')
      const env = gitlessEnv()
      const git = makeGitCommand(directory, env)

      // First create an initial commit so we can make subsequent commits
      fs.writeFileSync(path.join(directory, '.gitignore'), 'node_modules\n')
      git('add', '.gitignore')
      git('commit', '-m', 'Initial commit')

      // Now add the file that will be overwritten
      fs.writeFileSync(existingFile, 'existing readme content')
      git('add', 'README.md')
      git('commit', '-m', 'Add existing README')

      const initializer = new PackageInitializer(pkg)
      await initializer.initialize(directory)

      // Check that the file was overwritten with template content
      const readmeContent = fs.readFileSync(existingFile, 'utf8')
      expect(readmeContent).toContain('@limulus/zuul')
      expect(readmeContent).toContain('There is only zuul')
      expect(readmeContent).not.toContain('existing readme content')
    })

    it('should fail when repository has untracked files that would be overwritten', async () => {
      // Create an untracked file that would conflict with a template file
      const conflictingFile = path.join(directory, 'README.md')
      fs.writeFileSync(conflictingFile, 'untracked readme content')

      const initializer = new PackageInitializer(pkg)
      await expect(initializer.initialize(directory)).rejects.toThrow(/must be clean/)
    })
  })
})

const packageOptions = {
  name: '@limulus/zuul',
  description: 'There is only zuul',
  author: { name: 'Ivo Shandor' },
  github: { owner: 'limulus' },
}

const makePackage = (): Package => new Package(packageOptions)

interface GeneratedPackageJson {
  repository: { url: string }
  author: Record<string, string>
  license: string
  bugs: { url: string }
  homepage: string
  publishConfig: Record<string, string>
}

const readPackageJson = (directory: string): GeneratedPackageJson =>
  JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'))

const readWorkflow = (directory: string): string =>
  fs.readFileSync(path.join(directory, '.github', 'workflows', 'cd.yaml'), 'utf8')

const makeGitRepo = (): string => {
  const directory = temporaryDirectory()
  const env = gitlessEnv()
  const git = makeGitCommand(directory, env)

  execFileSync('git', ['init', directory], { env, stdio: 'pipe' })
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'Test User')
  git('checkout', '-b', 'main')
  return directory
}

const makeGitCommand =
  (directory: string, env: NodeJS.ProcessEnv) =>
  (...args: string[]) =>
    execFileSync('git', args, { cwd: directory, env, stdio: 'pipe' })

const gitlessEnv = () =>
  Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')))
