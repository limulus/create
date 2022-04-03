import ProcessMock from '../mocks/ProcessMock'
import CLI from './CLI'
import Package from './Package'
import PackageInitializer from './PackageInitializer'

jest.mock('./Package')
const MockedPackage = Package as jest.MockedClass<typeof Package>

jest.mock('./PackageInitializer')
const MockedPackageInitializer = PackageInitializer as jest.MockedClass<
  typeof PackageInitializer
>

describe('CLI', () => {
  describe('run()', () => {
    let proc: ProcessMock

    beforeEach(() => {
      proc = new ProcessMock(['name', 'a description'])
      jest.spyOn(proc, 'cwd').mockImplementation().mockReturnValue('fakecwd')
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('should create PackageInitializer with values from args', async () => {
      const cli = new CLI(proc)
      await cli.run()
      const pkg = MockedPackage.mock.instances[0]
      expect(MockedPackageInitializer).toHaveBeenCalledWith(pkg)
      const pkgConstructorCall = MockedPackage.mock.calls[0]
      expect(pkgConstructorCall).toEqual([
        {
          name: 'name',
          description: 'a description',
        },
      ])
    })

    it('should call PackageInitializer.initialize() with cwd', async () => {
      const cli = new CLI(proc)
      await cli.run()
      expect(MockedPackageInitializer.prototype.initialize).toHaveBeenCalledWith('fakecwd')
    })
  })
})
