# create

Create a TypeScript npm package or project

## Usage

From within a fresh and empty git repository whose `origin` remote is on GitHub:

```sh
npm init @unallocate @scope/pkgname 'A short description'
npm install
```

Once the project is written, `create` prints a short list of next steps fitted to the
options used: what to review before the first commit, what a release needs, and a reminder
that a releasing commit pushed to `main` publishes.

Every generated project starts with a [delto](https://github.com/limulus/delto) backlog:
`create` runs `npx @limulus/delto@1 bootstrap`, which writes `BACKLOG.md` and
`docs/journal/README.md`, and the generated `AGENTS.md` tells coding agents how to keep
them. This is `create`'s one network call. When it fails, for example offline, the project
is still created; `create` warns and lists the bootstrap command among the next steps, to
run by hand. A repository that already has a `BACKLOG.md` keeps it, and bootstrap is
skipped.

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
is generated), with CI publishing through npm's trusted publishing, so no npm token is
needed:

```sh
npm init @unallocate @scope/pkgname 'A short description' --public
```

Unscoped packages are always public, with or without `--public`.

### Setting up npm for a public package

A public package's publish job in `.github/workflows/cd.yaml` authenticates to npm through
GitHub's OIDC token (its `id-token: write` permission) and holds no npm token. npm attests
provenance for each release when the GitHub repository is public. npm has to be told to
trust that workflow once, before the first release:

1. Create the package on npm, since a trusted publisher can only be added to a package that
   exists. `npm stage publish`, run from the generated project, creates it without
   publishing a usable release: it leaves a `0.0.0-stage` placeholder and stages the
   version in `package.json`, which you then reject with `npm stage reject <stage-id>`.
   It needs a newer npm than some Node 24 releases bundle; `npx npm@latest stage publish`
   runs the latest.
2. In the package's settings on npmjs.com, add a Trusted Publisher for GitHub Actions with
   the repository's owner and name and the workflow filename `cd.yaml`, leaving the
   environment empty.
3. Under the publisher's allowed actions, allow `npm publish`. A publisher created after
   2026-09-03 allows only `npm stage publish` by default, which would leave every release
   staged until someone approves it.

npm expires a trusted publisher that has not published within two days of being created,
so add it shortly before the first release.

### Options

- `--target <node|web>`: Set the module target (default: node)
- `--public`: Publish a scoped package publicly to the npm registry, MIT licensed
- `--owner <owner>`: GitHub owner, for when `origin` is not a GitHub repository
- `--author <author>`: Author and copyright holder (default: from git config)
- `-h`, `--help`: Display help information

### Releasing

Work on `main` from the start; there is no separate branch to merge for a first release. The
generated workflow runs semantic-release on every push, so pushing a commit to `main` that
releases (a `feat` or `fix`, or any commit marked as a breaking change) publishes a new
version, starting at 1.0.0. A private package can publish to GitHub Packages on its first
such push, as soon as the repository's default token permissions allow it. A public package
publishes nothing until its npm setup, described above, is done.