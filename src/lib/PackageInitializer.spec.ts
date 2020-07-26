import fs from 'fs'
import Git from 'nodegit'
import path from 'path'
import tempy from 'tempy'

import Package from './Package'
import PackageInitializer from './PackageInitializer'

describe('PackageInitializer', () => {
  let pkg: Package
  let directory: string

  beforeEach(async () => {
    pkg = makePackage()
    directory = await makeGitRepo()
  })

  describe('.initialize()', () => {
    it('should contain files copied from skel', async () => {
      const initializer = new PackageInitializer(pkg)
      await initializer.initialize(directory)
      const tsConfigPath = path.join(directory, 'tsconfig.json')
      expect(fs.existsSync(tsConfigPath)).toBe(true)
    })

    it.todo('should remove .mustache extension on template files')
    it.todo('should hydrate templates with info from given Package object')
  })
})

const makePackage = (): Package => {
  return new Package({ name: '@limulus/zuul', description: 'There is only zuul' })
}

const makeGitRepo = async (): Promise<string> => {
  const directory = tempy.directory()
  await Git.Repository.init(directory, 0)
  return directory
}
