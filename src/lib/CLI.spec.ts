import getStream from 'get-stream'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { inject } from './CLI.js'
import PackageInitializerMock from '../mocks/PackageInitializerMock.js'
import PackageMock from '../mocks/PackageMock.js'
import ProcessMock from '../mocks/ProcessMock.js'

const CLI = inject({ Package: PackageMock, PackageInitializer: PackageInitializerMock })

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
          target: 'node', // Default target
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
          target: 'web',
        },
      ])
    })

    it('should throw error for invalid target value', async () => {
      process = new ProcessMock(['name', 'a description', '--target', 'invalid'])
      const cli = new CLI(process)
      await expect(cli.run()).rejects.toThrow(
        'Invalid target: invalid. Must be "web" or "node"'
      )
    })

    it('should call PackageInitializer.initialize() with cwd', async () => {
      const cli = new CLI(process)
      await cli.run()
      expect(PackageInitializerMock.mock.instances[0].initialize).toHaveBeenCalledWith(
        'fakecwd'
      )
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

    it('should handle error from Package constructor', async () => {
      const stderrPromise = getStream(process.stderr)

      PackageMock.mockImplementationOnce(() => {
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
