import { parseArgs } from 'node:util'
import parseAuthor from 'parse-author'

import GitRepository, { MissingGitInfoError } from './GitRepository.ts'
import Package, { type PackageAuthor, type PackageTarget } from './Package.ts'
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
  public: boolean
  owner?: string
  author?: string
  positionals: string[]
}

const helpText = `
Usage: create <package-name> <description> [options]

The package name is the full name, including the scope if it has one. The GitHub
owner and repository in package.json come from the origin remote.

Options:
  --target <target>  Set the module target (node or web) [default: node]
  --public           Publish a scoped package to npm publicly, MIT licensed
                     [default: scoped packages go private to GitHub Packages]
  --owner <owner>    GitHub owner, for when there is no GitHub origin remote;
                     the repository is then named after the unscoped package name
  --author <author>  Author and copyright holder, as "Name <email> (url)"
                     [default: user.name and user.email from git config]
  -h, --help         Show this help text

Examples:
  create my-package "A description of my package"
  create my-package "A description of my package" --target web
  create @my-scope/my-package "A description of my package" --public
  create @my-scope/my-package "A description" --owner my-org --author "Jane Doe"
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
      public: { type: 'boolean', default: false },
      owner: { type: 'string' },
      author: { type: 'string' },
    },
    allowPositionals: true,
  })

  if (!isPackageTarget(values.target)) {
    throw new Error(`Invalid target: ${values.target}. Must be "web" or "node"`)
  }

  return {
    help: values.help === true,
    target: values.target,
    public: values.public === true,
    owner: values.owner,
    author: values.author,
    positionals,
  }
}

/**
 * Turns a missing piece of git information into an error that names the option that
 * supplies it by hand.
 */
const suggestOption = async <T>(lookup: Promise<T>, option: string): Promise<T> => {
  try {
    return await lookup
  } catch (error) {
    if (error instanceof MissingGitInfoError) {
      throw new Error(`${error.message}; pass ${option} to supply it`)
    }
    throw error
  }
}

const authorFromOption = (value: string): PackageAuthor => {
  const { name = '', email, url } = parseAuthor(value)
  return { name, email, url }
}

export const inject = ({ GitRepository, Package, PackageInitializer }: InjectOptions) =>
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
        const repository = new GitRepository(this.process.cwd())
        const github =
          options.owner === undefined
            ? await suggestOption(repository.githubRepository(), '--owner <owner>')
            : { owner: options.owner }
        const author =
          options.author === undefined
            ? await suggestOption(repository.author(), '--author <author>')
            : authorFromOption(options.author)
        const pkg = new Package({
          name,
          description,
          author,
          github,
          target: options.target,
          public: options.public,
        })
        const initializer = new PackageInitializer(pkg)
        await initializer.initialize(this.process.cwd())
      } catch (error) {
        this.process.stderr.write(`Error: ${(error as Error).message}\n`)
        this.process.exit(1)
      }
    }
  }

export interface InjectOptions {
  GitRepository: typeof GitRepository
  Package: typeof Package
  PackageInitializer: typeof PackageInitializer
}

const CLI = inject({ GitRepository, Package, PackageInitializer })
export default CLI
