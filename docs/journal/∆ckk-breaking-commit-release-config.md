---
id: ∆ckk
completed: 2026-11-22 12:34:05 -07:00
---

## Backlog item

> - `∆ckk` Release config that honors `!` breaking commits
>   - commitlint accepts a bare `feat!:` header, but semantic-release's default preset
>     cannot parse it and releases nothing. Also corrects the guides' list of commits that
>     release.

## Planning

Generated projects and `create` itself released with `npx --yes semantic-release@25` and no
configuration file, so semantic-release used its default angular preset. That preset's
header pattern has no place for `!`, so it cannot parse `feat!: x`; commitlint's
`@commitlint/config-conventional`, used here and in generated projects, accepts it. A bare
`!` header with no `BREAKING CHANGE:` footer therefore passed commitlint and then released
nothing. (A `!` header that also had the footer still released a major, because the footer
is read from the body.) No commit in this repo's history used a `!` header.

The conventionalcommits preset parses `!`, but semantic-release does not bundle it: it has
to be installed beside semantic-release. A comment in `continuous-release.yaml` recorded
that semantic-release is deliberately not a devDependency, so that `npm ci` does not pay for
its large tree. lemmon took the other route: semantic-release and the preset are
devDependencies, and its `.releaserc.json` names the preset for both `commit-analyzer` and
`release-notes-generator`.

Both agent guides also said only `feat` and `fix` change the version, while
semantic-release's default release rules also release a patch for `perf` and for reverts.

Eric's decisions (2026-11-22):

- semantic-release stays out of devDependencies, in generated projects and here. The release
  step installs it and the conventionalcommits preset through `npx`, at pinned majors.
- Both agent guides keep requiring a `BREAKING CHANGE:` footer on a breaking change. A `!`
  header may be mentioned only as an addition to the footer.
- This item corrects the version-bump list in both agent guides to name `perf` and `revert`
  as patch releases.

## Refinement

What was done:

- Added `.releaserc.json` at the repo root and in `skel/` (identical files). Each names the
  conventionalcommits preset for `commit-analyzer` and `release-notes-generator` and lists
  `@semantic-release/npm` and `@semantic-release/github` after them, which is the default
  plugin list with the preset applied. lemmon's exec plugin was left out: that is the
  workspace release, `∆Van`.
- Changed the release step in `.github/workflows/continuous-release.yaml` and
  `skel/.github/workflows/cd.yaml.mustache` to
  `npx --yes -p semantic-release@25 -p conventional-changelog-conventionalcommits@9 semantic-release`,
  and extended the comment above it to say why the preset is installed there. Only the
  `run:` line and its comment changed, so `∆i4r`'s edits to the same job's permissions and
  token env merge cleanly.
- Both agent guides: the breaking-change bullet now allows a `!` header only in addition to
  the footer; the version list names `fix` and `perf` as patch releases and adds that a
  revert releases a patch, marked by the `This reverts commit <sha>.` body.
- `PackageInitializer.spec.ts`: `.releaserc.json` joins the copied-files list, and two
  regression specs, for private and public packages, check that the generated config names
  the preset for both plugins and that the workflow installs the preset in the `npx` call.
  The workflow spec asserts the exact `semantic-release@25` / `conventionalcommits@9` pair,
  so bumping either major alone (for example the incompatible preset 10) fails it.

Choices made during implementation:

- **Preset major 9, not the latest 10.** The first dry-run with `@10` failed in
  `release-notes-generator`: preset 10 requires `conventional-changelog-writer@9`, and
  release-notes-generator 14 (what semantic-release 25 depends on) loads writer 8. Major 9
  is also what lemmon uses. Raising it is tied to a future semantic-release major.
- **`branches` left unset**, so semantic-release's default branch list still applies; adding
  lemmon's `["main"]` would have changed release behavior beyond this item. Likewise
  lemmon's github-plugin options (no success/fail comments) were not copied.
- **Revert wording.** Dry-runs showed that a bare `revert: feat: x` header releases nothing;
  only a commit carrying the `This reverts commit <sha>.` body releases a patch, whether its
  header is git's `Revert "…"` or `revert: …`. The guides say so rather than calling
  `revert` a prefix that releases. commitlint accepts git's `Revert "…"` header.
- `perf` was not added to the guides' list of commit types, only to the version list, to
  stay inside the decided scope.

Verification:

- `npm run verify` green (84 tests, 100% coverage), `npm run build` green, and
  `npm pack --dry-run` lists `skel/.releaserc.json` (the root one is not shipped).
- The new specs were negative-tested by switching `skel/.releaserc.json` to the angular
  preset and dropping the preset from the template's `npx` line: all four failed, then
  passed once the edits were reversed.
- Generated projects from this worktree's `dist/bin/create.js` for private node, private
  web, public node and public web: `npm install && npm run verify && npm run build` passed
  in each, and each has the same `.releaserc.json` and `npx` line.
- `semantic-release --dry-run` in a generated scratch project, run with the exact `npx`
  command from the workflow, `--no-ci`, a local bare repository as `--repository-url`, and a
  no-op `verifyConditions` plugin standing in for the npm and GitHub token checks. Over a
  bare `feat!: drop everything` commit after `v1.0.0` it computed 2.0.0, with the change
  under "BREAKING CHANGES" in the notes. With `.releaserc.json` moved aside, the same commit
  gave "no release", reproducing the bug. `feat` gave a minor; `fix`, `perf` and a
  `git revert` of a released commit gave a patch; `chore` and a bare `revert:` header gave
  no release; `fix:` with a `BREAKING CHANGE:` footer gave a major.

## Retrospective

Pinning two `npx` packages at separate majors does not guarantee they work together; only
running the release in dry-run showed preset 10 was incompatible. When a release step
installs plugins beside semantic-release, dry-run it in a scratch project with the exact
command before choosing majors.
