# Release workspace packages together at one version

## Background

Verified in the code on 2026-11-22:

- lemmon's `.releaserc.json` uses `commit-analyzer` and `release-notes-generator` with the
  conventionalcommits preset, plus `@semantic-release/exec` and `@semantic-release/github`.
  It does not use `@semantic-release/npm`.
- Its exec `prepareCmd` sets every package to the release version with
  `npm version --workspaces`, then pins the shell's dependency on the core to that version
  with `npm pkg set`, then runs `npm run test:pack`. Its `publishCmd` publishes the core and
  then the shell.
- The package names, the one pinned dependency and the publish order are all written out by
  hand in that file.
- lemmon's release job waits on every other CI job, grants `contents: write` and
  `id-token: write`, checks out with `fetch-depth: 0`, and holds no npm token.
- lemmon's `test:pack` builds a site with the installed `lem` CLI, which makes it specific
  to lemmon.
- lemmon's journal entry `∆PiI` records why Eric chose lockstep versions over independent
  ones on 2026-11-08, including that the shell works only with the matching core and that
  one version per repo is semantic-release's own model.
- menschen's workspace publishes one package and keeps the rest `"private": true` at version
  0.0.0, released with plain semantic-release.
- `create` and `skel/` release with semantic-release's default configuration, which
  publishes a single package.

## Scope and constraints

Eric's decisions, 2026-11-22:

- The release versions, pins and publishes only the workspace packages that are not
  `"private": true`.
- The release works for both kinds of package: private scoped packages publish to GitHub
  Packages, and public packages publish to npm through trusted publishing.
- The template has no generic pack-and-install check before publishing.

## Implementation suggestions

From the research on 2026-11-22; the planner may drop them.

- A generated workspace starts with one package (`∆Oe3`), so the names, the pinned
  dependencies and the publish order that lemmon writes by hand would need deriving or
  templating.
