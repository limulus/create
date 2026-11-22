# Release config that honors `!` breaking commits

## Background

Verified in the code on 2026-11-22:

- Generated projects and `create` itself release with `npx --yes semantic-release@25` and no
  configuration file, so semantic-release uses its default angular preset.
- The angular preset's header pattern has no place for `!`, so it cannot parse `feat!: x`.
  The conventionalcommits preset accepts it.
- A `!` header that also carries a `BREAKING CHANGE:` footer still releases a major under
  the angular preset, because the footer is read from the body. Only a bare `!` header with
  no footer releases nothing.
- commitlint, in generated projects and here, uses `@commitlint/config-conventional`, which
  accepts `!` headers. So a commit can pass commitlint and then release nothing.
- semantic-release does not bundle the conventionalcommits preset. The preset has to be
  installed beside it, either as a devDependency or in the same `npx` install.
- A comment in `.github/workflows/continuous-release.yaml` records that semantic-release is
  deliberately not a devDependency, so that `npm ci` does not pay for its large tree.
- lemmon took the other route: semantic-release and the preset are devDependencies, and
  `.releaserc.json` names the preset for both `commit-analyzer` and
  `release-notes-generator`.
- Both `AGENTS.md` and `skel/AGENTS.md.mustache` say that only `feat` and `fix` change the
  version. semantic-release's default rules also release a patch for `perf` and for reverts.
- No commit in this repo's history uses a `!` header.

## Scope and constraints

Eric's decisions, 2026-11-22:

- semantic-release stays out of devDependencies, in generated projects and here. The release
  step installs it and the conventionalcommits preset through `npx`, at pinned majors.
- Both agent guides keep requiring a `BREAKING CHANGE:` footer on a breaking change. A `!`
  header may be mentioned only as an addition to the footer.
- This item corrects the version-bump list in both agent guides to name `perf` and `revert`
  as patch releases.

## Implementation suggestions

From the research on 2026-11-22; the planner may drop them.

- A `.releaserc.json` naming the conventionalcommits preset for `commit-analyzer` and
  `release-notes-generator`, as lemmon's does, without lemmon's exec plugin. That plugin is
  the workspace release, `∆Van`.
- Pass the preset as an extra `-p` package in the `npx` call, so the plugins can resolve it
  from the same install.
- Check the result with `semantic-release --dry-run` in a generated project, over a `feat!:`
  commit that has no footer.
