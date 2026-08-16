import { parseArgs } from 'node:util'

import Package, { type PackageTarget } from './Package.ts'
import PackageInitializer from './PackageInitializer.ts'

interface Process extends NodeJS.EventEmitter {
  readonly argv: string[]
  readonly env: { [k: string]: string | undefined }
  readonly stdin: NodeJS.ReadableStream
  readonly stdout: NodeJS.WritableStream
  readonly stderr: NodeJS.WritableStream
  exit: (code: number) => void
  cwd: () => string
}

interface CLIOptions {
  help: boolean
  target: PackageTarget
  positionals: string[]
}

const helpText = `
Usage: create <package-name> <description> [options]

Options:
  --target <target>  Set the module target (node or web) [default: node]
  -h, --help         Show this help text

Examples:
  create my-package "A description of my package"
  create my-package "A description of my package" --target web
`

const isPackageTarget = (value: unknown): value is PackageTarget =>
  value === 'node' || value === 'web'

/**
 * Throws on malformed input — an unknown option, a missing option argument, or a
 * `--target` value outside the supported set. `run()` renders those as a stderr message
 * plus usage text rather than letting them escape as a stack trace.
 */
const parseOptions = (args: string[]): CLIOptions => {
  const { values, positionals } = parseArgs({
    args,
    options: {
      help: { type: 'boolean', short: 'h', default: false },
      target: { type: 'string', default: 'node' },
    },
    allowPositionals: true,
  })

  if (!isPackageTarget(values.target)) {
    throw new Error(`Invalid target: ${values.target}. Must be "web" or "node"`)
  }

  return { help: values.help === true, target: values.target, positionals }
}

export const inject = ({ Package, PackageInitializer }: InjectOptions) =>
  class CLI {
    readonly process: Process

    constructor(process: Process) {
      this.process = process
    }

    async run(): Promise<void> {
      let options: CLIOptions

      try {
        options = parseOptions(this.process.argv.slice(2))
      } catch (error) {
        this.process.stderr.write(`Error: ${(error as Error).message}\n\n`)
        this.process.stderr.write(helpText)
        this.process.exit(1)
        return
      }

      if (options.help) {
        this.process.stdout.write(helpText)
        this.process.exit(0)
        return
      }

      if (options.positionals.length < 2) {
        this.process.stderr.write('Error: Missing required arguments\n\n')
        this.process.stderr.write(helpText)
        this.process.exit(1)
        return
      }

      const [name, description] = options.positionals

      try {
        const pkg = new Package({ name, description, target: options.target })
        const initializer = new PackageInitializer(pkg)
        await initializer.initialize(this.process.cwd())
      } catch (error) {
        this.process.stderr.write(`Error: ${(error as Error).message}\n`)
        this.process.exit(1)
      }
    }
  }

export interface InjectOptions {
  Package: typeof Package
  PackageInitializer: typeof PackageInitializer
}

const CLI = inject({ Package, PackageInitializer })
export default CLI
