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

    get arguments(): string[] {
      return this.process.argv.slice(2)
    }

    async run(): Promise<void> {
      const args = this.arguments
      const name = args[0]
      const description = args[1]
      let target: PackageTarget = 'node'

      // Look for --target option
      const targetIndex = args.indexOf('--target')
      if (targetIndex !== -1 && targetIndex + 1 < args.length) {
        const targetValue = args[targetIndex + 1]
        if (targetValue !== 'web' && targetValue !== 'node') {
          throw new Error(`Invalid target: ${targetValue}. Must be "web" or "node"`)
        }
        target = targetValue as PackageTarget
      }

      const pkg = new Package({ name, description, target })
      const initializer = new PackageInitializer(pkg)
      await initializer.initialize(this.process.cwd())
    }
  }

export interface InjectOptions {
  Package: typeof Package
  PackageInitializer: typeof PackageInitializer
}

export default inject({ Package, PackageInitializer })
