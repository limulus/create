---
id: ∆D1e
completed: 2026-11-22 12:27:35 -07:00
---

## Backlog item

> - `∆D1e` Remove unused GitHub Packages read auth
>   - Drop the `@unallocate` registry `.npmrc` and the `GPR_READ_TOKEN` CI step from
>     generated projects and from this repo. Nothing either installs comes from GitHub
>     Packages.

## Planning

Generated projects had an `.npmrc` mapping the `@unallocate` scope to GitHub Packages,
whatever the package's own scope or visibility, and both jobs of their CI workflow passed
`NODE_AUTH_TOKEN: ${{ secrets.GPR_READ_TOKEN }}` to `npm ci`. `create` itself had the same
root `.npmrc` and the same env in `continuous-release.yaml`.

None of it did anything. npm reads `NODE_AUTH_TOKEN` only through an `.npmrc` auth line;
`setup-node` writes one only when given `registry-url`, which neither workflow passes, and
the `.npmrc` files had none. Nothing a generated project or `create` installs comes from
GitHub Packages — `@limulus/eslint-config` resolves from the public registry — and
publishing takes its registry from `publishConfig.registry`, not `.npmrc`. lemmon and
menschen (a private `@limulus` package publishing to GitHub Packages) have no `.npmrc` at
all.

Eric's decisions (2026-11-22):

- Remove the `.npmrc` and the `GPR_READ_TOKEN` env from every generated project, private
  ones included.
- Remove `create`'s own root `.npmrc` and the `GPR_READ_TOKEN` env in its workflow.
- Do not give private projects an `.npmrc` mapping their own scope to GitHub Packages
  instead: every package in that scope would then resolve from GitHub Packages, public ones
  such as `@limulus/eslint-config` included.

## Refinement

What was done:

- Deleted `skel/.npmrc.mustache` and the root `.npmrc`.
- Dropped the `env: NODE_AUTH_TOKEN` block from both `npm ci` steps in
  `skel/.github/workflows/cd.yaml.mustache` and in
  `.github/workflows/continuous-release.yaml`.
- Removed `.npmrc.mustache` from the copied-files list in `PackageInitializer.spec.ts` and
  added regression specs, for both a private and a public package, that no `.npmrc` is
  generated and that the workflow never mentions `GPR_READ_TOKEN`.

Choice made during implementation: the regression specs were added rather than only deleting
the list entry, so a future template edit that reintroduces either one fails the suite. They
were negative-tested by restoring a `skel/.npmrc.mustache` and appending a `GPR_READ_TOKEN`
line to the workflow template: all four new specs failed, then passed once the probe was
reversed.

Verification:

- `npm run verify` (lint, tests at 100% coverage, tscc) and `npm run build` green.
- Clean clone of the item branch, with `NPM_CONFIG_USERCONFIG` pointed at an empty file so
  no user-level registry mapping could help: `npm ci` succeeded, the lockfile has no
  `npm.pkg.github.com` entries, and `npm run verify` passed there.
- Generated private/public × node/web projects from the built CLI, with the same empty user
  config: none has an `.npmrc` or `GPR_READ_TOKEN`, and each passed `npm install`,
  `npm run verify` and `npm run build` with no GitHub Packages entries in its lockfile.

Left alone: the `GPR_READ_TOKEN` repository secret itself, if one exists in GitHub, is now
unused and can be deleted by Eric. Publishing to GitHub Packages for private packages
(`publishConfig.registry`, `GITHUB_TOKEN`) is unchanged.

## Retrospective

The template change was small; most of the time went to proving a negative (that nothing
needed the auth). Pointing `NPM_CONFIG_USERCONFIG` at an empty file is a cheap way to make
local install checks behave like CI and not lean on a developer's own `~/.npmrc`. In zsh, an
unquoted `$var` holding several CLI flags is not word-split; use `${=var}` or an array when
looping over option sets.
