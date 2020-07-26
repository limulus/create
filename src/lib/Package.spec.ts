import Package from './Package'

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
