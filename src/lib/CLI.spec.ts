import { jest } from '@jest/globals'

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
      jest.spyOn(process, 'cwd').mockReturnValue('fakecwd')
    })

    afterEach(() => {
      jest.clearAllMocks()
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
  })
})
