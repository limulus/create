import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

import Package from './Package.ts'
import { formatNextSteps, nextSteps } from './nextSteps.ts'

const options = {
  description: 'a description',
  author: { name: 'Jane Doe' },
  github: { owner: 'jane' },
}

describe('nextSteps()', () => {
  describe('for any package', () => {
    const steps = nextSteps(new Package({ ...options, name: '@jane/pkg' }))

    it('should start with npm install', () => {
      expect(steps[0]).toContain('npm install')
    })

    it('should ask for the generated files to be reviewed', () => {
      expect(steps.join('\n')).toMatch(
        /Review[^]*package\.json, README\.md, AGENTS\.md, \.github\/workflows\/cd\.yaml/
      )
    })

    it('should say to work on main and warn that a releasing push publishes', () => {
      const text = steps.join(' ')
      expect(text).toContain('Work on main')
      expect(text).toMatch(/feat, fix or breaking-change commit to main\s+publishes/)
    })

    it('should not mention a v1-workspace branch', () => {
      expect(steps.join(' ')).not.toContain('v1-workspace')
    })
  })

  describe('for a private package', () => {
    const text = nextSteps(new Package({ ...options, name: '@jane/pkg' })).join('\n')

    it('should name GITHUB_TOKEN and GitHub Packages', () => {
      expect(text).toContain('GitHub Packages')
      expect(text).toContain('GITHUB_TOKEN')
    })

    it('should not name the npm setup or a LICENSE', () => {
      expect(text).not.toContain('npm must trust')
      expect(text).not.toContain('LICENSE')
    })
  })

  describe.each([
    ['a scoped package created with --public', { name: '@jane/pkg', public: true }],
    ['an unscoped package', { name: 'pkg' }],
  ])('for %s', (_, pkgOptions) => {
    const text = nextSteps(new Package({ ...options, ...pkgOptions })).join('\n')

    it('should ask for LICENSE to be reviewed', () => {
      expect(text).toMatch(/cd\.yaml, LICENSE\./)
    })

    it('should point to the npm trusted publishing setup', () => {
      expect(text).toContain('npm must trust .github/workflows/cd.yaml')
      expect(text).toMatch(
        /see\nhttps:\/\/github\.com\/[\w.-]+\/[\w.-]+#setting-up-npm-for-a-public-package$/m
      )
    })

    it("should link to a heading that exists in this tool's README", () => {
      const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8')
      expect(readme).toMatch(/^#+ Setting up npm for a public package$/m)
    })

    it('should not name GITHUB_TOKEN or GitHub Packages', () => {
      expect(text).not.toContain('GITHUB_TOKEN')
      expect(text).not.toContain('GitHub Packages')
    })
  })
})

describe('formatNextSteps()', () => {
  const pkg = new Package({ ...options, name: '@jane/pkg' })

  it('should name the package and number each step, indenting continuation lines', () => {
    expect(formatNextSteps(pkg, ['First', 'Second\nand more'])).toBe(
      '\nCreated @jane/pkg. Next steps:\n\n' +
        '  1. First\n' +
        '  2. Second\n' +
        '     and more\n'
    )
  })

  it('should keep continuation lines aligned past nine steps', () => {
    const steps = [...Array.from({ length: 9 }, () => 'step'), 'tenth\nmore']
    expect(formatNextSteps(pkg, steps)).toContain('  10. tenth\n      more\n')
  })
})
