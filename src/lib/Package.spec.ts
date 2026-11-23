import { vi, describe, it, expect, afterEach } from 'vitest'

import Package, { type PackageAuthor } from './Package.ts'

const packageOptions = {
  name: '@limulus/zuul',
  description: 'There is only zuul',
  author: { name: 'Jane Doe' },
  github: { owner: 'limulus' },
}

describe('Package', () => {
  describe('constructor()', () => {
    it('should copy properties from passed options', () => {
      const pkg = makePackage()
      expect(pkg).toHaveProperty('name', '@limulus/zuul')
      expect(pkg).toHaveProperty('description', 'There is only zuul')
    })

    it('should throw if and only if name is invalid for a new npm package', () => {
      expect(() => makePackage('Hello_World')).toThrow(
        'Hello_World: invalid package name (name can no longer contain capital letters)'
      )
      expect(() => makePackage('foo bar')).toThrow(
        /invalid package name \(name can only contain URL-friendly characters\)/
      )
      expect(() => makePackage('foo-bar')).not.toThrow()
      expect(() => makePackage('@limulus/bar-baz')).not.toThrow()
      expect(() => makePackage('@limulus/bar.js')).not.toThrow()
      expect(() => makePackage('1st_place')).not.toThrow()
    })

    it('should keep only the known author fields', () => {
      const pkg = new Package({
        ...packageOptions,
        author: { name: 'Jane', email: 'j@example.com', extra: 'x' } as PackageAuthor,
      })
      expect(pkg.author).toEqual({ name: 'Jane', email: 'j@example.com' })
    })

    it('should throw when the author has no name', () => {
      expect(
        () => new Package({ ...packageOptions, author: { name: ' ', email: 'j@x.org' } })
      ).toThrow('author: a name is required')
    })

    it('should use the given GitHub owner and repository', () => {
      const pkg = new Package({
        ...packageOptions,
        name: 'zuul',
        github: { owner: 'o', repo: 'r.js' },
      })
      expect(pkg.github).toEqual({ owner: 'o', repo: 'r.js' })
    })

    it('should name the GitHub repository after the unscoped name by default', () => {
      const pkg = new Package({ ...packageOptions, github: { owner: 'limulus' } })
      expect(pkg.github).toEqual({ owner: 'limulus', repo: 'zuul' })
    })

    it('should throw if and only if the GitHub owner is invalid', () => {
      const withOwner = (owner: string) => () =>
        new Package({ ...packageOptions, name: 'zuul', github: { owner } })
      expect(withOwner('-bad')).toThrow('-bad: invalid GitHub owner')
      expect(withOwner('a/b')).toThrow(/invalid GitHub owner/)
      expect(withOwner('a.b')).toThrow(/invalid GitHub owner/)
      expect(withOwner('')).toThrow(/invalid GitHub owner/)
      expect(withOwner('Some-Org2')).not.toThrow()
      expect(withOwner('legacy--name-')).not.toThrow()
    })

    it('should throw if and only if the GitHub repository name is invalid', () => {
      const withRepo = (repo: string) => () =>
        new Package({ ...packageOptions, github: { owner: 'limulus', repo } })
      expect(withRepo('a/b')).toThrow('a/b: invalid GitHub repository name')
      expect(withRepo('')).toThrow(/invalid GitHub repository name/)
      expect(withRepo('My_repo.js-2')).not.toThrow()
    })

    describe('when the scope is not the GitHub owner’s', () => {
      const withName = (name: string, isPublic?: boolean) => () =>
        new Package({
          ...packageOptions,
          name,
          github: { owner: 'Some-Org' },
          public: isPublic,
        })

      it('should throw for a private package, which GitHub Packages would refuse', () => {
        expect(withName('@limulus/zuul')).toThrow(
          '@limulus/zuul: a private package publishes to GitHub Packages, which accepts ' +
            'only the scope @some-org from a repository owned by Some-Org; use that scope, ' +
            'or make the package public'
        )
      })

      it('should not throw for a public package, which publishes to npm', () => {
        expect(withName('@limulus/zuul', true)).not.toThrow()
        expect(withName('zuul')).not.toThrow()
      })
    })

    it('should match a private package’s scope to the GitHub owner without regard to case', () => {
      expect(
        () =>
          new Package({
            ...packageOptions,
            name: '@some-org/zuul',
            github: { owner: 'Some-Org' },
          })
      ).not.toThrow()
    })

    it('should default to node target when not specified', () => {
      const pkg = makePackage('@limulus/zuul')
      expect(pkg).toHaveProperty('target', 'node')
    })

    it('should set target when specified', () => {
      const pkg = makePackage('@limulus/zuul', 'web')
      expect(pkg).toHaveProperty('target', 'web')
    })

    it('should default public to false when not specified', () => {
      const pkg = makePackage()
      expect(pkg).toHaveProperty('public', false)
    })

    it('should set public when specified', () => {
      const pkg = makePackage('@limulus/zuul', undefined, true)
      expect(pkg).toHaveProperty('public', true)
    })

    it('should throw an error for invalid target', () => {
      expect(
        () =>
          new Package({
            ...packageOptions,
            target: 'invalid' as any,
          })
      ).toThrow(/invalid target/)
    })
  })

  describe('.isPrivate', () => {
    describe('when package has a scope', () => {
      it('should return true', () => {
        const pkg = makePackage('@limulus/foo')
        expect(pkg.isPrivate).toBe(true)
      })

      describe('and is public', () => {
        it('should return false', () => {
          const pkg = makePackage('@limulus/foo', undefined, true)
          expect(pkg.isPrivate).toBe(false)
        })
      })
    })

    describe('when package is unscoped', () => {
      it('should return false', () => {
        const pkg = makePackage('foo')
        expect(pkg.isPrivate).toBe(false)
      })
    })
  })

  describe('.license', () => {
    describe('when package is private', () => {
      it('should return `UNLICENSED`', () => {
        const pkg = makePackage('hello')
        vi.spyOn(pkg, 'isPrivate', 'get').mockReturnValue(true)
        expect(pkg.license).toBe('UNLICENSED')
      })
    })

    describe('when package is public', () => {
      it('should return `MIT`', () => {
        const pkg = makePackage('hello')
        vi.spyOn(pkg, 'isPrivate', 'get').mockReturnValue(false)
        expect(pkg.license).toBe('MIT')
      })
    })
  })

  describe('.authorJson', () => {
    it('should render the author as package.json-indented JSON', () => {
      const pkg = new Package({
        ...packageOptions,
        author: { name: 'Jane "JD" Doe', email: 'j@example.com', url: 'https://x.org' },
      })
      expect(pkg.authorJson).toBe(
        '{\n' +
          '    "name": "Jane \\"JD\\" Doe",\n' +
          '    "email": "j@example.com",\n' +
          '    "url": "https://x.org"\n' +
          '  }'
      )
    })

    it('should leave out fields the author does not have', () => {
      const pkg = makePackage()
      expect(JSON.parse(pkg.authorJson)).toEqual({ name: 'Jane Doe' })
      expect(pkg.authorJson).not.toContain('email')
    })
  })

  describe('.copyrightYear', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return the current year', () => {
      vi.useFakeTimers({ now: new Date(2031, 5, 15) })
      const pkg = makePackage()
      expect(pkg.copyrightYear).toBe(2031)
    })
  })

  describe('.publishRegistry', () => {
    describe('when package is private', () => {
      it('should return GitHub Package Registry URL', () => {
        const pkg = makePackage('foo')
        vi.spyOn(pkg, 'isPrivate', 'get').mockReturnValue(true)
        expect(pkg.publishRegistry).toBe('https://npm.pkg.github.com')
      })
    })

    describe('when package is public', () => {
      it('should return npm Registry URL', () => {
        const pkg = makePackage('foo')
        vi.spyOn(pkg, 'isPrivate', 'get').mockReturnValue(false)
        expect(pkg.publishRegistry).toBe('https://registry.npmjs.org/')
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

  describe('.moduleConfig', () => {
    describe('when target is node', () => {
      it('should return NodeNext module configuration', () => {
        const pkg = makePackage('@limulus/zuul', 'node')
        expect(pkg.moduleConfig).toEqual({
          module: 'NodeNext',
          moduleResolution: 'nodenext',
          types: ['node'],
        })
      })
    })

    describe('when target is web', () => {
      it('should return ESNext module configuration', () => {
        const pkg = makePackage('@limulus/zuul', 'web')
        expect(pkg.moduleConfig).toEqual({
          module: 'ESNext',
          moduleResolution: 'bundler',
        })
      })
    })
  })
})

const makePackage = (
  name = '@limulus/zuul',
  target?: 'node' | 'web',
  isPublic?: boolean
): Package => {
  return new Package({
    ...packageOptions,
    name,
    target,
    public: isPublic,
  })
}
