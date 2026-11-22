# Publish this tool as `@limulus/create`

## Value

Anyone can run `npm init @limulus` to scaffold a package, where today the tool is published
privately for Eric's own use.

## Background

Verified in the code on 2026-11-22:

- The package is named `@unallocate/create`. Its `repository`, `bugs` and `homepage` URLs
  point at `github.com/unallocate/create`, and the git remote is
  `https://github.com/unallocate/create.git`.
- `publishConfig.registry` is GitHub Packages, with no `access` field. CI publishes with
  `npx --yes semantic-release@25`, passing `GITHUB_TOKEN` as the npm token. That token can
  publish only to GitHub Packages, under a scope that matches the repository owner.
- GitHub Packages needs a token even to install a public package.
- `bin` is the string `dist/bin/create.js`, so `npm init @limulus` resolves to the package
  `@limulus/create`, as `npm init @unallocate` resolves to `@unallocate/create` today.
- The repo has 44 release tags in semantic-release's default `v${version}` format. The
  latest is `v1.23.0`. With no `tagFormat` override, a renamed package released from this
  repo continues from there.
- Other places that name `@unallocate`: `AGENTS.md`, the usage lines in `README.md`, and
  sample values in `GitRepository.spec.ts` and `Package.spec.ts`.
- lemmon's rule for a retired name: it gets no alias and no deprecation message, and its
  commit is a breaking change released as a major.

## Scope and constraints

Eric's decisions, 2026-11-22:

- `@limulus/create` publishes to the public npm registry through trusted publishing, not to
  GitHub Packages.
- This repo's own release workflow moves to trusted publishing in this item.
- The repository moves from `github.com/unallocate/create` to `github.com/limulus/create`,
  and the `repository`, `bugs` and `homepage` URLs in `package.json` follow.
- `@unallocate/create` is left as it is: no final release, no alias and no deprecation
  message.
- The first `@limulus/create` release is a new major, 2.0.0.

`∆P8j` has landed, so the tool no longer writes Eric's own scopes, GitHub account and name
into what it generates. Its commit carries a `BREAKING CHANGE:` footer. `∆D1e` removed this
repo's root `.npmrc` and its `GPR_READ_TOKEN` step.
