import getStream from 'get-stream'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { inject } from './CLI.ts'
import { MissingGitInfoError } from './GitRepository.ts'
import GitRepositoryMock from '../mocks/GitRepositoryMock.ts'
import PackageInitializerMock from '../mocks/PackageInitializerMock.ts'
import PackageMock from '../mocks/PackageMock.ts'
import ProcessMock from '../mocks/ProcessMock.ts'

const CLI = inject({
  GitRepository: GitRepositoryMock,
  Package: PackageMock,
  PackageInitializer: PackageInitializerMock,
})

const gitAuthor = { name: 'Git Author', email: 'git@example.com' }
const originGitHub = { owner: 'origin-owner', repo: 'origin-repo' }

describe('CLI', () => {
  describe('run()', () => {
    let process: ProcessMock

    beforeEach(() => {
      process = new ProcessMock(['name', 'a description'])
      vi.spyOn(process, 'cwd').mockReturnValue('fakecwd')
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('should create PackageInitializer with values from args', async () => {
      const cli = new CLI(process)
      await cli.run()
      expect(PackageInitializerMock).toHaveBeenCalled()
      const pkgConstructorCall = PackageMock.mock.calls[0]
      expect(pkgConstructorCall).toEqual([
        {
          name: 'name',
          description: 'a description',
          author: gitAuthor,
          github: originGitHub,
          target: 'node', // Default target
          public: false,
        },
      ])
    })

    it('should use web target when specified with --target', async () => {
      process = new ProcessMock(['name', 'a description', '--target', 'web'])
      const cli = new CLI(process)
      await cli.run()
      const pkgConstructorCall = PackageMock.mock.calls[0]
      expect(pkgConstructorCall).toEqual([
        {
          name: 'name',
          description: 'a description',
          author: gitAuthor,
          github: originGitHub,
          target: 'web',
          public: false,
        },
      ])
    })

    it('should create a public Package when --public is passed', async () => {
      process = new ProcessMock(['@limulus/name', 'a description', '--public'])
      const cli = new CLI(process)
      await cli.run()
      const pkgConstructorCall = PackageMock.mock.calls[0]
      expect(pkgConstructorCall).toEqual([
        {
          name: '@limulus/name',
          description: 'a description',
          author: gitAuthor,
          github: originGitHub,
          target: 'node',
          public: true,
        },
      ])
    })

    it('should report an invalid target value and exit non-zero', async () => {
      process = new ProcessMock(['name', 'a description', '--target', 'invalid'])
      const stderrPromise = getStream(process.stderr)

      const cli = new CLI(process)
      await cli.run()
      const stderrData = await stderrPromise

      expect(stderrData).toContain(
        'Error: Invalid target: invalid. Must be "web" or "node"'
      )
      expect(stderrData).toContain('Usage: create')
      expect(process.exit).toHaveBeenCalledWith(1)
      expect(PackageMock).not.toHaveBeenCalled()
    })

    it('should report a missing --target argument and exit non-zero', async () => {
      process = new ProcessMock(['name', 'a description', '--target'])
      const stderrPromise = getStream(process.stderr)

      const cli = new CLI(process)
      await cli.run()
      const stderrData = await stderrPromise

      expect(stderrData).toContain(`Option '--target <value>' argument missing`)
      expect(process.exit).toHaveBeenCalledWith(1)
      expect(PackageMock).not.toHaveBeenCalled()
    })

    it('should report an unknown option and exit non-zero', async () => {
      process = new ProcessMock(['name', 'a description', '--bogus'])
      const stderrPromise = getStream(process.stderr)

      const cli = new CLI(process)
      await cli.run()
      const stderrData = await stderrPromise

      expect(stderrData).toContain(`Unknown option '--bogus'`)
      expect(process.exit).toHaveBeenCalledWith(1)
      expect(PackageMock).not.toHaveBeenCalled()
    })

    it('should display help when -h is passed', async () => {
      process = new ProcessMock(['-h'])

      const stdoutPromise = getStream(process.stdout)

      const cli = new CLI(process)
      await cli.run()
      const stdoutData = await stdoutPromise

      expect(stdoutData).toContain('Usage: create <package-name> <description> [options]')
      expect(process.exit).toHaveBeenCalledWith(0)
      expect(PackageMock).not.toHaveBeenCalled()
    })

    it('should call PackageInitializer.initialize() with cwd', async () => {
      const cli = new CLI(process)
      await cli.run()
      expect(PackageInitializerMock.mock.instances[0].initialize).toHaveBeenCalledWith(
        'fakecwd'
      )
    })

    it('should print the next steps to stdout after initializing', async () => {
      const cli = new CLI(process)
      await cli.run()
      process.stdout.end()
      const stdoutData = await getStream(process.stdout)
      expect(stdoutData).toContain('Created @mock/package. Next steps:')
      expect(stdoutData).toContain('1. Run `npm install`')
      expect(stdoutData).toContain('GITHUB_TOKEN')
      expect(process.exit).not.toHaveBeenCalled()
    })

    it('should not print the next steps when initializing fails', async () => {
      vi.mocked(PackageInitializerMock.prototype.initialize).mockRejectedValueOnce(
        new Error('fakecwd: must be clean')
      )
      const stdoutPromise = getStream(process.stdout)
      const stderrPromise = getStream(process.stderr)
      const cli = new CLI(process)
      await cli.run()
      expect(await stderrPromise).toContain('Error: fakecwd: must be clean')
      expect(await stdoutPromise).toBe('')
    })

    it('should display help when --help is passed', async () => {
      process = new ProcessMock(['--help'])
      vi.spyOn(process, 'cwd').mockReturnValue('fakecwd')

      const stdoutPromise = getStream(process.stdout)

      const cli = new CLI(process)
      await cli.run()
      const stdoutData = await stdoutPromise

      expect(stdoutData).toContain('Usage: create <package-name> <description> [options]')
      expect(stdoutData).toContain('--target <target>')
      expect(stdoutData).toContain('--public')
      expect(stdoutData).toContain('--owner <owner>')
      expect(stdoutData).toContain('--author <author>')
      expect(stdoutData).toContain('--help')

      expect(process.exit).toHaveBeenCalledWith(0)
      expect(PackageMock).not.toHaveBeenCalled()
    })

    it('should display error and help when required arguments are missing', async () => {
      process = new ProcessMock([])
      vi.spyOn(process, 'cwd').mockReturnValue('fakecwd')

      const stderrPromise = getStream(process.stderr)

      const cli = new CLI(process)
      await cli.run()

      const stderrData = await stderrPromise

      expect(stderrData).toContain('Error: Missing required arguments')
      expect(stderrData).toContain('Usage: create')

      expect(process.exit).toHaveBeenCalledWith(1)
      expect(PackageMock).not.toHaveBeenCalled()
    })

    it('should look up git information in the working directory', async () => {
      const cli = new CLI(process)
      await cli.run()
      expect(GitRepositoryMock).toHaveBeenCalledWith('fakecwd')
    })

    describe('when --owner is passed', () => {
      it('should use that owner instead of reading the origin remote', async () => {
        process = new ProcessMock(['name', 'a description', '--owner', 'flag-owner'])
        const cli = new CLI(process)
        await cli.run()
        expect(GitRepositoryMock.prototype.githubRepository).not.toHaveBeenCalled()
        expect(PackageMock.mock.calls[0][0]).toHaveProperty('github', {
          owner: 'flag-owner',
        })
      })
    })

    describe('when the GitHub repository cannot be read from git', () => {
      it('should report it, suggest --owner and exit non-zero', async () => {
        vi.mocked(GitRepositoryMock.prototype.githubRepository).mockRejectedValueOnce(
          new MissingGitInfoError(`remote 'origin' does not exist`)
        )
        const stderrPromise = getStream(process.stderr)
        const cli = new CLI(process)
        await cli.run()
        expect(await stderrPromise).toContain(
          `Error: remote 'origin' does not exist; pass --owner <owner> to supply it`
        )
        expect(process.exit).toHaveBeenCalledWith(1)
        expect(PackageMock).not.toHaveBeenCalled()
      })
    })

    describe('when git fails for some other reason', () => {
      it('should report the error as is and exit non-zero', async () => {
        vi.mocked(GitRepositoryMock.prototype.githubRepository).mockRejectedValueOnce(
          new Error('fakecwd: must be a git repository')
        )
        const stderrPromise = getStream(process.stderr)
        const cli = new CLI(process)
        await cli.run()
        const stderrData = await stderrPromise
        expect(stderrData).toContain('Error: fakecwd: must be a git repository\n')
        expect(stderrData).not.toContain('--owner')
        expect(process.exit).toHaveBeenCalledWith(1)
      })
    })

    describe('when --author is passed', () => {
      it('should parse it as an npm person instead of reading git config', async () => {
        process = new ProcessMock([
          'name',
          'a description',
          '--author',
          'Jane Doe <jane@example.com> (https://example.com/)',
        ])
        const cli = new CLI(process)
        await cli.run()
        expect(GitRepositoryMock.prototype.author).not.toHaveBeenCalled()
        expect(PackageMock.mock.calls[0][0]).toHaveProperty('author', {
          name: 'Jane Doe',
          email: 'jane@example.com',
          url: 'https://example.com/',
        })
      })

      it('should pass an empty name on for Package to reject when it has none', async () => {
        process = new ProcessMock(['name', 'a description', '--author', '<a@b.c>'])
        const cli = new CLI(process)
        await cli.run()
        expect(PackageMock.mock.calls[0][0]).toHaveProperty('author', {
          name: '',
          email: 'a@b.c',
          url: undefined,
        })
      })
    })

    describe('when the author cannot be read from git config', () => {
      it('should report it, suggest --author and exit non-zero', async () => {
        vi.mocked(GitRepositoryMock.prototype.author).mockRejectedValueOnce(
          new MissingGitInfoError('git config user.name is not set')
        )
        const stderrPromise = getStream(process.stderr)
        const cli = new CLI(process)
        await cli.run()
        expect(await stderrPromise).toContain(
          'Error: git config user.name is not set; pass --author <author> to supply it'
        )
        expect(process.exit).toHaveBeenCalledWith(1)
        expect(PackageMock).not.toHaveBeenCalled()
      })
    })

    it('should handle error from Package constructor', async () => {
      const stderrPromise = getStream(process.stderr)

      PackageMock.mockImplementationOnce(function () {
        throw new Error('Test error')
      })
      const cli = new CLI(process)
      await cli.run()

      const stderrData = await stderrPromise

      expect(stderrData).toContain('Error: Test error')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })
})
