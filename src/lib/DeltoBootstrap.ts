import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

/** The command a user runs by hand when `create` could not run it. */
export const bootstrapCommand = 'npx @limulus/delto@1 bootstrap'

export type BootstrapResult =
  { outcome: 'created' } | { outcome: 'existing' } | { outcome: 'failed'; reason: string }

export type BootstrapOutcome = BootstrapResult['outcome']

const firstLine = (text: string): string =>
  text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line !== '') ?? ''

/**
 * Runs `delto bootstrap` in a directory to write the starter `BACKLOG.md`, journal README
 * and claim-ledger `.gitignore` entry. A directory that already has a `BACKLOG.md` is left
 * alone, as bootstrap would refuse it. Failing to run it is not an error: the result
 * carries a one-line reason instead, so the caller can carry on and tell the user.
 */
export default class DeltoBootstrap {
  readonly command: string
  readonly args: string[]

  // `--yes` because npx otherwise stops to ask before installing delto into its cache.
  constructor(command = 'npx', args = ['--yes', '@limulus/delto@1', 'bootstrap']) {
    this.command = command
    this.args = args
  }

  async run(directory: string): Promise<BootstrapResult> {
    if (existsSync(path.join(directory, 'BACKLOG.md'))) {
      return { outcome: 'existing' }
    }
    try {
      await promisify(execFile)(this.command, this.args, { cwd: directory })
      return { outcome: 'created' }
    } catch (error) {
      const { message, stderr = '' } = error as Error & { stderr?: string }
      return { outcome: 'failed', reason: firstLine(stderr) || firstLine(message) }
    }
  }
}
