export type PackageTarget = 'node' | 'web'

interface PackageOptions {
  name: string
  description: string
  target?: PackageTarget
  public?: boolean
}

export default class Package {
  readonly name
  readonly description
  readonly target: PackageTarget
  readonly public: boolean

  constructor(options: PackageOptions) {
    this.name = options.name
    this.description = options.description
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
    const validPackageNameRe = /^(?:@[a-z][a-z0-9-]*\/)?[a-z][a-z0-9-]*/
    if (!validPackageNameRe.test(this.name)) {
      throw new Error(`${this.name}: invalid package name`)
    }

    const validTargets: PackageTarget[] = ['node', 'web']
    if (!validTargets.includes(this.target)) {
      throw new Error(`${this.target}: invalid target type`)
    }
  }
}
