interface PackageOptions {
  name: string
  description: string
}

export default class Package {
  readonly name
  readonly description

  constructor(options: PackageOptions) {
    this.name = options.name
    this.description = options.description
    this.validate()
  }

  get isPrivate(): boolean {
    return this.scope !== ''
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

  private validate(): void {
    const validPackageNameRe = /^(?:@[a-z][a-z0-9-]*\/)?[a-z][a-z0-9-]*/
    if (!validPackageNameRe.test(this.name)) {
      throw new Error(`${this.name}: invalid package name`)
    }
  }
}
