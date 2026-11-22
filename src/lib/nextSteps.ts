import { readFileSync } from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { bootstrapCommand, type BootstrapOutcome } from './DeltoBootstrap.ts'
import type Package from './Package.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Derived from this tool's own package.json rather than written out, so the link follows
// the repository wherever its metadata says it lives.
const npmSetupUrl = (): string => {
  const manifest = path.resolve(__dirname, '..', '..', 'package.json')
  const { homepage } = JSON.parse(readFileSync(manifest, 'utf8')) as { homepage: string }
  return `${homepage.split('#')[0]}#setting-up-npm-for-a-public-package`
}

const backlogSteps: Record<BootstrapOutcome, string> = {
  created:
    'Install the delto agent skill with `npx skills add limulus/delto`.\n' +
    'BACKLOG.md and docs/journal/ are set up; AGENTS.md says how to use them.',
  existing:
    'Install the delto agent skill with `npx skills add limulus/delto`.\n' +
    'The repository already had a BACKLOG.md, so delto left it as it was;\n' +
    'AGENTS.md says how to use it.',
  failed:
    `Set up the backlog, which delto could not do just now: run\n\`${bootstrapCommand}\`, ` +
    'then install the delto agent\nskill with `npx skills add limulus/delto`.',
}

/**
 * What to do after `create` has written a project, as one entry per step, fitted to the
 * package and to how delto's bootstrap went. A step may span lines;
 * `formatNextSteps()` numbers and indents them. Callers may append steps of their own
 * before formatting.
 */
export const nextSteps = (pkg: Package, backlog: BootstrapOutcome): string[] => {
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
    backlogSteps[backlog],
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
