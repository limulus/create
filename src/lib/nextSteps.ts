import { readFileSync } from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import type Package from './Package.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Derived from this tool's own package.json rather than written out, so the link follows
// the repository wherever its metadata says it lives.
const npmSetupUrl = (): string => {
  const manifest = path.resolve(__dirname, '..', '..', 'package.json')
  const { homepage } = JSON.parse(readFileSync(manifest, 'utf8')) as { homepage: string }
  return `${homepage.split('#')[0]}#setting-up-npm-for-a-public-package`
}

/**
 * What to do after `create` has written a project, as one entry per step, fitted to the
 * package. A step may span lines; `formatNextSteps()` numbers and indents them. Callers may
 * append steps of their own before formatting.
 */
export const nextSteps = (pkg: Package): string[] => {
  const files = ['package.json', 'README.md', 'AGENTS.md', '.github/workflows/cd.yaml']
  if (!pkg.isPrivate) {
    files.push('LICENSE')
  }

  const publishing = pkg.isPrivate
    ? 'No secrets to add: CI publishes to GitHub Packages with the built-in\n' +
      "GITHUB_TOKEN, once the repository's default workflow permissions\n" +
      'allow it.'
    : 'No secrets to add, but npm must trust .github/workflows/cd.yaml before\n' +
      'the first release; until then nothing publishes. For the setup, see\n' +
      npmSetupUrl()

  return [
    'Run `npm install`, which also installs the git hooks.',
    `Review the generated files before committing them, especially\n${files.join(', ')}.`,
    publishing,
    'Work on main. Pushing a feat, fix or breaking-change commit to main\n' +
      'publishes a release, starting at 1.0.0.',
  ]
}

export const formatNextSteps = (pkg: Package, steps: string[]): string => {
  const items = steps.map((step, index) => {
    const marker = `${index + 1}. `
    const indent = ' '.repeat(marker.length)
    return `  ${marker}${step.replaceAll('\n', `\n  ${indent}`)}\n`
  })
  return `\nCreated ${pkg.name}. Next steps:\n\n${items.join('')}`
}
