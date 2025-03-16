import Package, { PackageTarget } from './Package.js'
import PackageInitializer from './PackageInitializer.js'

interface Process extends NodeJS.EventEmitter {
  readonly argv: string[]
  readonly env: { [k: string]: string | undefined }
  readonly stdin: NodeJS.ReadableStream
  readonly stdout: NodeJS.WritableStream
  readonly stderr: NodeJS.WritableStream
  exit: (code: number) => void
  cwd: () => string
}

export const inject = ({ Package, PackageInitializer }: InjectOptions) =>
  class CLI {
    constructor(readonly process: Process) {}

    async run(): Promise<void> {
      const helpText = `
Usage: create <package-name> <description> [options]

Options:
  --target <target>  Set the module target (node or web) [default: node]
  --help             Show this help text

Examples:
  create my-package "A description of my package"
  create my-package "A description of my package" --target web
`

      const { values, positionals } = this.parseArgs(this.process.argv.slice(2))

      if (values.help) {
        this.process.stdout.write(helpText)
        this.process.exit(0)
        return
      }

      if (positionals.length < 2) {
        this.process.stderr.write('Error: Missing required arguments\n\n')
        this.process.stderr.write(helpText)
        this.process.exit(1)
        return
      }

      const name = positionals[0]
      const description = positionals[1]
      const target = (values.target as PackageTarget) || 'node'

      try {
        const pkg = new Package({ name, description, target })
        const initializer = new PackageInitializer(pkg)
        await initializer.initialize(this.process.cwd())
      } catch (error) {
        this.process.stderr.write(`Error: ${(error as Error).message}\n`)
        this.process.exit(1)
      }
    }

    /**
     * Simple argument parser that mimics the Node.js parseArgs API
     */
    parseArgs(args: string[]): {
      values: Record<string, unknown>
      positionals: string[]
    } {
      const values: Record<string, unknown> = {}
      const positionals: string[] = []

      for (let i = 0; i < args.length; i++) {
        const arg = args[i]

        if (arg.startsWith('--')) {
          const name = arg.slice(2)

          if (name === 'help') {
            values.help = true
            continue
          }

          if (name === 'target' && i + 1 < args.length && !args[i + 1].startsWith('--')) {
            const value = args[i + 1]
            if (value !== 'web' && value !== 'node') {
              throw new Error(`Invalid target: ${value}. Must be "web" or "node"`)
            }
            values.target = value
            i++ // Skip the next argument since we've consumed it
          }
        } else {
          positionals.push(arg)
        }
      }

      return { values, positionals }
    }
  }

export interface InjectOptions {
  Package: typeof Package
  PackageInitializer: typeof PackageInitializer
}

const CLI = inject({ Package, PackageInitializer })
export default CLI
