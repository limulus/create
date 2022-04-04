import { jest } from '@jest/globals'

import Package from './Package.js'

describe('Package', () => {
  describe('constructor()', () => {
    it('should copy properties from passed options', () => {
      const pkg = makePackage()
      expect(pkg).toHaveProperty('name', '@limulus/zuul')
      expect(pkg).toHaveProperty('description', 'There is only zuul')
    })

    it('should throw if and only if name is invalid', () => {
      expect(() => makePackage('Hello_World')).toThrow(/package name/)
      expect(() => makePackage('foo-bar')).not.toThrow()
      expect(() => makePackage('@foo/bar-baz')).not.toThrow()
    })
  })

  describe('.isPrivate', () => {
    describe('when package has a scope', () => {
      it('should return true', () => {
        const pkg = makePackage('@unallocate/foo')
        expect(pkg.isPrivate).toBe(true)
      })
    })

    describe('when package is unscoped', () => {
      it('should return false', () => {
        const pkg = makePackage('foo')
        expect(pkg.isPrivate).toBe(false)
      })
    })
  })

  describe('.publishRegistry', () => {
    describe('when package is private', () => {
      it('should return GitHub Package Registry URL', () => {
        const pkg = makePackage('foo')
        jest.spyOn(pkg, 'isPrivate', 'get').mockReturnValue(true)
        expect(pkg.publishRegistry).toBe('https://npm.pkg.github.com')
      })
    })

    describe('when package is public', () => {
      it('should return npm Registry URL', () => {
        const pkg = makePackage('foo')
        jest.spyOn(pkg, 'isPrivate', 'get').mockReturnValue(false)
        expect(pkg.publishRegistry).toBe('https://registry.npmjs.org')
      })
    })
  })

  describe('.publishTokenSecretName', () => {
    describe('when package is private', () => {
      it('should return `GITHUB_TOKEN`', () => {
        const pkg = makePackage('hello')
        jest.spyOn(pkg, 'isPrivate', 'get').mockReturnValue(true)
        expect(pkg.publishTokenSecretName).toBe('GITHUB_TOKEN')
      })
    })

    describe('when package is public', () => {
      it('should return `NPM_TOKEN`', () => {
        const pkg = makePackage('hello')
        jest.spyOn(pkg, 'isPrivate', 'get').mockReturnValue(false)
        expect(pkg.publishTokenSecretName).toBe('NPM_TOKEN')
      })
    })
  })

  describe('.scope', () => {
    describe('when package name has a @scope prefix', () => {
      it('should return the @scope', () => {
        const pkg = makePackage()
        expect(pkg).toHaveProperty('scope', '@limulus')
      })
    })

    describe('when package name has no @scope prefix', () => {
      it('should return the empty string', () => {
        const pkg = makePackage('zuul')
        expect(pkg).toHaveProperty('scope', '')
      })
    })
  })

  describe('.unscopedName', () => {
    describe('when name contains a @scope', () => {
      it('should return just the last part of the package name', () => {
        const pkg = makePackage()
        expect(pkg).toHaveProperty('unscopedName', 'zuul')
      })
    })

    describe('when name has no @scope', () => {
      it('should return the same value as the name property', () => {
        const pkg = makePackage('foo')
        expect(pkg).toHaveProperty('unscopedName', 'foo')
      })
    })
  })
})

const makePackage = (name = '@limulus/zuul'): Package => {
  return new Package({
    name,
    description: 'There is only zuul',
  })
}
