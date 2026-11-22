import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  createArguments,
  packedPackage,
  stepFault,
  unpackedTemplates,
  VARIANTS,
  withoutNpmConfig,
} from './lib/skeleton.ts'

// Packs `create` as `npm publish` would, then generates each template variant from that
// tarball in a fresh git repository outside this one and runs the generated project's
// `verify` and `build`: what a user of the published tool gets, short of the registry.
// It needs the network, since the generated projects install from npm, and a git
// identity for the scratch commits. CI runs it; `npm run verify` does not.

const env = withoutNpmConfig(process.env)
const grouped = process.env.GITHUB_ACTIONS === 'true'

function fail(faults: string[], kept: string): never {
  for (const fault of faults) console.error(`test:skel: ${fault}`)
  console.error(`test:skel: left ${kept} as it was`)
  process.exit(1)
}

function run(command: string, args: string[], cwd: string): string | null {
  console.log(`test:skel: ${cwd}$ ${command} ${args.join(' ')}`)
  return stepFault(spawnSync(command, args, { cwd, env, stdio: 'inherit' }))
}

const dir = mkdtempSync(join(tmpdir(), 'create-skel-'))

// The build's own output goes to stderr, so stdout holds only the JSON report.
const packed = packedPackage(
  JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', dir], {
      encoding: 'utf8',
      env,
      stdio: ['ignore', 'pipe', 'inherit'],
    })
  )
)
const tarball = join(dir, packed.filename)

const tracked = execFileSync('git', ['ls-files', '-z', 'skel'], { encoding: 'utf8' })
  .split('\0')
  .filter((path) => path !== '')
const missing = unpackedTemplates(tracked, packed)
if (missing.length > 0) fail(missing, dir)

// A broken template often breaks several variants, so each one runs to its first failing
// step and the report lists every variant that failed, not only the first.
const faults: string[] = []
for (const variant of VARIANTS) {
  const project = join(dir, variant.label)
  mkdirSync(project)
  if (grouped) console.log(`::group::${variant.label}`)
  // `npx` would run a bare absolute path as a command, hence the `file:` spec. The path is
  // unique to this run, so `npx` cannot reuse an earlier tarball's install from its cache.
  const steps: [string, string[]][] = [
    ['git', ['init', '--quiet', '--initial-branch=main']],
    ['git', ['commit', '--quiet', '--allow-empty', '--message', 'init']],
    ['npx', ['--yes', `file:${tarball}`, ...createArguments(variant)]],
    ['npm', ['install', '--no-audit', '--no-fund']],
    ['npm', ['run', 'verify']],
    ['npm', ['run', 'build']],
  ]
  for (const [command, args] of steps) {
    const fault = run(command, args, project)
    if (fault !== null) {
      faults.push(`${variant.label}: \`${command} ${args.join(' ')}\` ${fault}`)
      break
    }
  }
  if (grouped) console.log('::endgroup::')
}
if (faults.length > 0) fail(faults, dir)

rmSync(dir, { force: true, recursive: true })
console.log(
  `test:skel: packed ${packed.name}@${packed.version}, generated ` +
    `${VARIANTS.map(({ label }) => label).join(', ')} from it, and each passed ` +
    `verify and build`
)
