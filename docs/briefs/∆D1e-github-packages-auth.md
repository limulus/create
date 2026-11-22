# Remove unused GitHub Packages read auth

## Background

Verified in the code on 2026-11-22:

- Every generated project gets an `.npmrc` mapping the `@unallocate` scope to GitHub
  Packages, whatever the package's scope or visibility. The file has no auth line.
- Both jobs in the generated workflow pass `NODE_AUTH_TOKEN: ${{ secrets.GPR_READ_TOKEN }}`
  to `npm ci`.
- That token reaches nothing. npm reads `NODE_AUTH_TOKEN` only through an `.npmrc` auth
  line. `setup-node` writes one only when given `registry-url`, which these workflows do not
  pass, and the template `.npmrc` has none.
- Nothing a generated project installs comes from GitHub Packages. `@limulus/eslint-config`
  resolves from the public npm registry. So no generated project, public or private, needs
  GitHub Packages read auth as the template stands.
- Publishing does not use the `.npmrc`. The registry comes from `publishConfig.registry`.
- Neither lemmon nor menschen has an `.npmrc`. menschen is a private `@limulus` package that
  publishes to GitHub Packages and depends on `@limulus/eslint-config` from npm.
- `create` itself has the same root `.npmrc` and the same `GPR_READ_TOKEN` env in
  `.github/workflows/continuous-release.yaml`, and its lockfile resolves nothing from GitHub
  Packages.
- `PackageInitializer.spec.ts` asserts that `.npmrc` lands in every generated project.

## Scope and constraints

Eric's decisions, 2026-11-22:

- The `.npmrc` and the `GPR_READ_TOKEN` step are removed from every generated project,
  private ones included.
- `create`'s own root `.npmrc` and the `GPR_READ_TOKEN` env in its workflow are removed too.
- A private project does not get an `.npmrc` mapping its own scope to GitHub Packages. Eric
  raised the idea and decided against it: every package in that scope would then resolve
  from GitHub Packages, public ones such as `@limulus/eslint-config` included.

## Implementation suggestions

From the research on 2026-11-22; the planner may drop them.

- Removing the template means taking `.npmrc.mustache` out of the copied-files list in
  `PackageInitializer.spec.ts`.
