# Generate-and-verify check for the skeleton

## Background

Verified in the code on 2026-11-22:

- No automated gate touches `skel/`. ESLint ignores it (`eslint.config.js`), and vitest
  excludes it from test discovery and from coverage (`vitest.config.ts`).
- `PackageInitializer.spec.ts` asserts that template files land in the target directory. It
  does not check that the generated project works.
- The only generate-and-verify procedure is the manual recipe under "Common Tasks" in
  `AGENTS.md`.
- CI's `verify` job runs `npm ci`, `npm run verify` and `npm run build` on Node 24 and 26,
  and `publish` waits on it. Nothing in CI generates a project.
- The published tarball ships `dist` and `skel`. `npm pack` drops `.npmrc` and renames
  `.gitignore`, which is why those two templates carry a `.mustache` suffix. A new dotfile
  added to `skel/` without the suffix would be missing from the published tool, and a check
  run against the checkout would not notice.
- The templates render differently by variant. `LICENSE` is left out of a private package.
  `publishConfig`, the license and the publish secret in `cd.yaml` differ between private
  and public. The tsconfig module settings differ between `--target node` and `web`.
- `skel/` has no lockfile, so a generated project installs the newest versions in its ranges
  at that moment. The check can go red without a commit to this repo.
- Everything a generated project installs comes from the public npm registry.
- Generation refuses a directory that is not a clean git repository. CI already sets a git
  identity and default branch in `.github/workflows/set-up-ci.sh`.
- lemmon's `test:pack` is the precedent: it packs the packages, installs the tarballs into
  an empty project outside the repo, and runs the installed CLI. It runs as a step of CI's
  `verify` job and is kept out of the local gate.

## Scope and constraints

Eric's decisions, 2026-11-22:

- The check generates from the npm-packed tarball of `create`, as published, not from the
  checkout's `skel/`.
- The check covers every variant whose templates differ: private and public, and the node
  and web targets.
- The check runs only in CI, and `publish` waits on it. It stays out of `npm run verify` and
  the pre-push hook.

## Implementation suggestions

From the research on 2026-11-22; the planner may drop them.

- Follow lemmon's split: a script that does the I/O, plus pure predicates in a covered
  module that a spec can feed a violation (`lemmon/scripts/check-pack.ts`,
  `lemmon/scripts/lib/packed.ts`).
- Run it after `npm run build` in the existing `verify` job's Node matrix.
- Once it lands, point the manual recipe in `AGENTS.md` at it, and say there that CI and
  `verify` differ by this check.
- After `∆P8j`, generation stops when it cannot read a GitHub owner from the repository. A
  scratch repository in CI has no `origin` remote, so the check will need the owner flag.
