# create

Create a TypeScript npm package or project

## Usage

From within a fresh and empty git repository whose `origin` remote is on GitHub:

```sh
git checkout -b v1-workspace
npm init @unallocate @scope/pkgname 'A short description'
npm install
```

The package name is the full name, including the scope when the package has one. Any name
that npm accepts for a new package can be used.

The `repository`, `bugs` and `homepage` URLs in the generated `package.json` point at the
GitHub repository that `origin` names, in any of the URL forms GitHub gives out (HTTPS, with
or without `.git`, or SSH). Without a GitHub `origin`, `create` stops with an error; pass
`--owner` to name the GitHub owner by hand, and the repository is then assumed to be named
after the unscoped package name:

```sh
npm init @unallocate @scope/pkgname 'A short description' --owner my-github-org
```

The author in `package.json`, who is also the copyright holder in a public package's
`LICENSE`, comes from `user.name` and `user.email` in git config. Pass `--author` to set it
instead, in npm's `Name <email> (url)` form, where the email and URL are optional:

```sh
npm init @unallocate @scope/pkgname 'A short description' --author 'Jane Doe <jane@example.com> (https://example.com/)'
```

You can also specify a target platform using the `--target` option:

```sh
npm init @unallocate @scope/pkgname 'A short description' --target web
```

Available targets:
- `node` (default): Uses NodeNext module resolution for Node.js projects 
- `web`: Uses ESNext modules with bundler resolution for web/browser projects

Scoped packages are private by default: they publish to GitHub Packages, are marked
`UNLICENSED`, and CI publishes with `GITHUB_TOKEN`. Pass `--public` to publish a scoped
package to the npm registry with `access: public`, under the MIT license (a `LICENSE` file
is generated), with CI publishing via the `NPM_TOKEN` secret:

```sh
npm init @unallocate @scope/pkgname 'A short description' --public
```

Unscoped packages are always public, with or without `--public`.

### Options

- `--target <node|web>`: Set the module target (default: node)
- `--public`: Publish a scoped package publicly to the npm registry, MIT licensed
- `--owner <owner>`: GitHub owner, for when `origin` is not a GitHub repository
- `--author <author>`: Author and copyright holder (default: from git config)
- `-h`, `--help`: Display help information

When you are ready to do an initial release, merge `v1-workspace` into `main`.