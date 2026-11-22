# Trusted publishing for public packages

## Background

Verified in the code on 2026-11-22:

- The generated publish job authenticates with a secret: `NPM_TOKEN` for a public package
  and `GITHUB_TOKEN` for a private one (`Package.publishTokenSecretName`). The job has no
  `permissions` block, so it does not have `id-token: write`.
- Specs pin both secret names (`PackageInitializer.spec.ts`, `Package.spec.ts`), and
  `README.md` tells users that a public package publishes through the `NPM_TOKEN` secret.
- semantic-release 25 bundles `@semantic-release/npm` 13, which tries an OIDC token exchange
  first and falls back to `NPM_TOKEN`. It needs `id-token: write` on the job.
- lemmon's release job holds no npm token. It sets `permissions: contents: write` and
  `id-token: write` and passes only `GITHUB_TOKEN`.
- npm's trusted-publisher record names the workflow file allowed to publish. The generated
  workflow is `.github/workflows/cd.yaml`.
- lemmon's journal entry `∆PiI` records what the npm side needs. A trusted publisher can be
  configured only on a package that already exists, so each package was first created with
  `npm stage publish`. A publisher created after 2026-09-03 only stages releases unless told
  to publish directly. Every Node 24 since 24.5.0 bundles an npm new enough.
- The generated publish job runs on Node 24.

## Scope and constraints

Eric's decisions, 2026-11-22:

- A public package publishes to npm through trusted publishing. This was decided with
  `∆P8j`.
- The work documents the one-time npm setup a new public package needs before its first
  release: creating the package, and configuring its trusted publisher to publish directly.
- Only generated projects change. `create`'s own release workflow moves to trusted
  publishing in `∆vIB`.

## Implementation suggestions

From the research on 2026-11-22; the planner may drop them.

- Give the public publish job `permissions: contents: write` and `id-token: write`, and drop
  its `NPM_TOKEN` env. `Package.publishTokenSecretName`, its specs and the README change
  with it.
- Name the workflow file in the setup documentation, since the npm-side record names it.
