import validatePackageName from 'validate-npm-package-name'

export type PackageTarget = 'node' | 'web'

export interface PackageAuthor {
  name: string
  email?: string
  url?: string
}

export interface PackageGitHub {
  owner: string
  repo: string
}

interface PackageOptions {
  name: string
  description: string
  author: PackageAuthor
  /** `repo` defaults to the unscoped package name. */
  github: { owner: string; repo?: string }
  target?: PackageTarget
  public?: boolean
}

export default class Package {
  readonly name
  readonly description
  readonly author: PackageAuthor
  readonly github: PackageGitHub
  readonly target: PackageTarget
  readonly public: boolean

  constructor(options: PackageOptions) {
    this.name = options.name
    this.description = options.description
    const { name, email, url } = options.author
    this.author = { name, email, url }
    this.github = {
      owner: options.github.owner,
      repo: options.github.repo ?? this.unscopedName,
    }
    this.target = options.target ?? 'node'
    this.public = options.public ?? false
    this.validate()
  }

  /**
   * Unscoped packages are always public, since GitHub Packages only hosts scoped ones. A
   * scoped package is private unless it was created with `public`.
   */
  get isPrivate(): boolean {
    return this.scope !== '' && !this.public
  }

  get license(): 'MIT' | 'UNLICENSED' {
    return this.isPrivate ? 'UNLICENSED' : 'MIT'
  }

  /**
   * The author as a JSON object indented to sit at the top level of `package.json`, so
   * that any characters in it are escaped and absent fields are left out.
   */
  get authorJson(): string {
    return JSON.stringify(this.author, null, 2).replaceAll('\n', '\n  ')
  }

  get copyrightYear(): number {
    return new Date().getFullYear()
  }

  get publishRegistry(): string {
    return this.isPrivate ? 'https://npm.pkg.github.com' : 'https://registry.npmjs.org'
  }

  get publishTokenSecretName(): 'GITHUB_TOKEN' | 'NPM_TOKEN' {
    return this.isPrivate ? 'GITHUB_TOKEN' : 'NPM_TOKEN'
  }

  get scope(): string {
    const parts = this.name.match(/^@[^/]+/)
    if (parts === null) {
      return ''
    } else {
      return parts[0]
    }
  }

  get unscopedName(): string {
    return this.name.replace(/^@[^/]+\//, '')
  }

  get moduleConfig(): Record<string, unknown> {
    if (this.target === 'node') {
      return {
        module: 'NodeNext',
        moduleResolution: 'nodenext',
        types: ['node'],
      }
    } else {
      return {
        module: 'ESNext',
        moduleResolution: 'bundler',
      }
    }
  }

  private validate(): void {
    const nameValidity = validatePackageName(this.name)
    if (!nameValidity.validForNewPackages) {
      const reasons = [...(nameValidity.errors ?? []), ...(nameValidity.warnings ?? [])]
      throw new Error(`${this.name}: invalid package name (${reasons.join('; ')})`)
    }

    if (this.author.name.trim() === '') {
      throw new Error('author: a name is required')
    }

    // GitHub's character rules: owners are alphanumerics and hyphens, not starting with a
    // hyphen; repository names also allow `.` and `_`. New accounts may not have
    // consecutive or trailing hyphens, but some older accounts do, so those are allowed.
    const validOwnerRe = /^[a-z\d][a-z\d-]*$/i
    if (!validOwnerRe.test(this.github.owner)) {
      throw new Error(`${this.github.owner}: invalid GitHub owner`)
    }
    const validRepoRe = /^[\w.-]+$/
    if (!validRepoRe.test(this.github.repo)) {
      throw new Error(`${this.github.repo}: invalid GitHub repository name`)
    }

    const validTargets: PackageTarget[] = ['node', 'web']
    if (!validTargets.includes(this.target)) {
      throw new Error(`${this.target}: invalid target type`)
    }
  }
}
