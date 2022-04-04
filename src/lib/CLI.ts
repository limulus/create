import Package from './Package.js'
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
      const [name, description] = this.arguments
      const pkg = new Package({ name, description })
      const initializer = new PackageInitializer(pkg)
      await initializer.initialize(this.process.cwd())
    }
  }

export interface InjectOptions {
  Package: typeof Package
  PackageInitializer: typeof PackageInitializer
}

export default inject({ Package, PackageInitializer })
