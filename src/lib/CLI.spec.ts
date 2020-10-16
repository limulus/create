import ProcessMock from '../mocks/ProcessMock'
import CLI from './CLI'
import PackageInitializer from './PackageInitializer'
import { mocked } from 'ts-jest/utils'
import Package from './Package'
import PackageInitialzier from './PackageInitializer'

jest.mock('./Package')
jest.mock('./PackageInitializer')

describe('CLI', () => {
  describe('run()', () => {
    let proc: ProcessMock

    beforeEach(() => {
      proc = new ProcessMock(['name', 'a description'])
      jest.spyOn(proc, 'cwd').mockImplementation().mockReturnValue('fakecwd')
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should create PackageInitializer with values from args', async () => {
      const cli = new CLI(proc)
      await cli.run()
      const pkg = mocked(Package).mock.instances[0]
      expect(mocked(PackageInitialzier)).toHaveBeenCalledWith(pkg)
      const pkgConstructorCall = mocked(Package).mock.calls[0]
      expect(pkgConstructorCall).toEqual([{
        name: 'name',
        description: 'a description',
      }])
    })

    it('should call PackageInitializer.initialize() with cwd', async () => {
      const cli = new CLI(proc)
      await cli.run()
      expect(
        mocked(PackageInitializer.prototype.initialize)
      ).toHaveBeenCalledWith('fakecwd')
    })
  })
})
