---
id: ∆Iod
completed: 2026-11-22 12:57:15 -07:00
---

## Backlog item

> - `∆Iod` Generate-and-verify check for the skeleton
>   - Pack `create`, generate each variant from the tarball and run its `verify` and `build`
>     in CI. Today no automated check notices a broken template.

## Planning

No automated gate touched `skel/`. ESLint ignores it, vitest excludes it from discovery and
coverage, and `PackageInitializer.spec.ts` only checks that template files land in the
target directory, not that the generated project works. The one generate-and-verify
procedure was the manual recipe in `AGENTS.md`. CI's `verify` job ran `npm ci`,
`npm run verify` and `npm run build` on Node 24 and 26, `publish` waited on it, and nothing
generated a project. Two further facts shaped the check. The published tarball ships `dist`
and `skel`, and `npm pack` drops or renames some dotfiles (it renames `.gitignore`, which is
why that template carries `.mustache`), so a check against the checkout would miss a
template that never ships. And the templates render differently by variant: `LICENSE`,
`publishConfig`, the license field and the publish job in `cd.yaml` by privacy, the tsconfig
module settings by target. lemmon's `test:pack` (`scripts/check-pack.ts` with predicates in
`scripts/lib/packed.ts`) was the precedent.

Eric's decisions, recorded in the brief:

- Generate from the npm-packed tarball of `create`, as published, not from the checkout's
  `skel/`.
- Cover every variant whose templates differ: private and public, node and web.
- Run only in CI, with `publish` waiting on it; keep it out of `npm run verify` and the
  pre-push hook.

Done, following lemmon's split:

- `scripts/checkSkeleton.ts` (`npm run test:skel`) does the I/O. It packs with
  `npm pack --json --pack-destination` into a fresh `mkdtemp` directory, takes the package
  name, version and tarball filename from that report (nothing is hard-coded, so ∆vIB's
  rename to `@limulus/create` needs no change here), and fails if any `git ls-files skel`
  path is absent from the packed file list. Then for each variant it creates a git
  repository with an empty commit on `main`, runs
  `npx --yes file:<tarball> <name> <desc> <options> --owner scratch-owner`, and runs
  `npm install`, `npm run verify` and `npm run build`. A failing step ends that variant but
  not the run: the remaining variants still run, and the check then exits 1 listing each
  failed variant with its step and how it failed (exit status, signal, or spawn error),
  leaving the directory for inspection. On success it removes the directory.
- `scripts/lib/skeleton.ts` holds the decisions, covered at 100% by
  `scripts/lib/skeleton.spec.ts`: the variant list, the `create` arguments, reading the
  `npm pack` report, the missing-template comparison, describing how a step failed, and
  stripping npm's `npm_*` variables from the environment the child npm runs see.
- `tsconfig.json` includes `scripts/**`, so tsc and typed lint cover it, and
  `vitest.config.ts` adds `scripts/lib/**/*.ts` to coverage.
- CI runs `npm run test:skel` as the last step of the existing `verify` job, after
  `npm run build`, on both Node versions. `publish` already `needs: verify`, so the publish
  job and the `needs` wiring are untouched, which keeps clear of ∆vIB's edits there.
- `AGENTS.md` points the skel-verification recipe at `npm run test:skel`, keeps the manual
  recipe for poking at one project, and says CI runs build and `test:skel` beyond what
  `verify` and pre-push run.

Choices made here:

- All four combinations, not two variants that each touch one axis value. The templates do
  not currently combine the axes, but "every variant" read as the full product is cheap: all
  four ran in about 50 s locally, sharing the npm cache.
- Variants run in sequence with inherited stdio, inside `::group::` markers under GitHub
  Actions, so a failing variant's output is readable. Parallel runs would interleave.
- The check passes `--owner` (a scratch repo has no `origin`, and generation has stopped
  without one since ∆P8j) but not `--author`, so the git-config author path is exercised;
  `set-up-ci.sh` already sets the identity.
- It does not parse `create`'s output and does not assert the generated file list, so ∆VNW's
  next-steps note and ∆cTZ's `delto bootstrap` (network, plus `BACKLOG.md` and
  `docs/journal/README.md`) land without touching it. The generated project's own `verify`
  is the verdict; the network is already required for `npm install`.
- The commit is `ci:`, since no file under `skel/` changed.

## Refinement

Surprises:

- `npx --yes /abs/path.tgz` does not install the tarball: npx treats a bare absolute path as
  a command and the shell answered "Permission denied" (exit 126). A relative `../x.tgz`
  works, and so does `file:/abs/path.tgz`, which the script uses.
- With `--json`, `npm pack` sends the `prepack` build's output to stderr, so stdout parses
  as JSON without `--ignore-scripts`. Packing therefore rebuilds `dist` as publishing would,
  rather than trusting whatever `dist` is on disk.

Verification:

- `npm run verify`: lint, test and tscc exit 0; 5 files fully covered at 100%.
  `npm run build` exits 0.
- `npm run test:skel` with `TMPDIR` pointed at the scratch space: exit 0, all four variants
  passed install, verify and build; the temporary directory was removed. Rerun with
  `CI=true GITHUB_ACTIONS=true` on the final tree: exit 0, with the group markers around
  each variant.
- Probe 1: dropped the comma inside `{{^package.isPrivate}}` in
  `skel/package.json.mustache`. Both private variants passed; `public-node` failed at
  `npm install` with `EJSONPARSE`, and the check exited 1 naming the variant and command.
  Reversed by restoring the comma.
- Probe 2: added `skel/.npmrc` and `git add -N` it. The check exited 1 with
  `skel/.npmrc is in the repository but not in the packed tarball` before generating
  anything. Reversed with `git rm --cached` and deleting the file.
- Probe 3, after review: dropped the comma after `"types": ["node"]` in
  `skel/tsconfig.base.json.mustache`, which only node variants render. `private-node` and
  `public-node` failed `npm run verify` with TS1005, both web variants still ran and passed
  verify and build, and the check exited 1 listing both node variants. Reversed by restoring
  the comma. Called from a scratch script, `stepFault` reported a real `spawnSync` killed by
  SIGTERM as "was killed by SIGTERM" and a missing command as "could not run: spawnSync …
  ENOENT", where the first version said "exited null".
- Not run: GitHub Actions itself, and Node 26, which is not installed here; the script uses
  only `node:` built-ins that Node 24 and 26 share.

## Retrospective

The predicates-plus-script split from lemmon carried over directly. The `npx` absolute-path
trap cost one run; trying the exact invocation by hand on a relative path first hid it, so
test the command in the form the script will build it.
