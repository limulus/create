---
id: ∆cTZ
completed: 2026-11-22 13:11:36 -07:00
---

## Backlog item

> - `∆cTZ` Start generated projects with a delto backlog
>   - Run `delto bootstrap` while generating, and add a backlog section to the generated
>     AGENTS.md. menschen and lemmon each set these up by hand.

## Planning

This section folds in the item's brief, written on 2026-11-22.

menschen and lemmon were generated from this tool and each set up a delto backlog by hand
afterwards. The item makes every generated project start with one.

Verified in the code that day:

- Neither `skel/AGENTS.md.mustache` nor this repo's `AGENTS.md` mentioned a backlog, delto,
  a journal or briefs.
- `delto bootstrap` writes three things: a `BACKLOG.md` with the preamble and the Refactors
  initiative, `docs/journal/README.md` with a "Last distilled" watermark set to the moment
  it runs, and a `.gitignore` block for the claim ledger. It refuses to run where a
  `BACKLOG.md` exists, and skips the `.gitignore` block when the line is already there.
- delto 1.3.0's journal README named `CLAUDE.md` in its distillation section, while
  generated projects have `AGENTS.md`.
- `create` made no network call and ran no other tool. `PackageInitializer` checks that the
  directory is a clean git repository and copies `skel/` into it.
- lemmon's guide has a "Backlog & journal (delto)" section covering the item format, briefs,
  `surface`, `claim`, `complete`, and minting with `npx @limulus/delto@1 mint`. It also
  describes a `docs/plans/` handoff, which is lemmon's own convention and not in the delto
  spec. menschen's "Backlog & Progress Tracking" section predates the current spec.

Eric's decisions, 2026-11-22:

- Every generated project gets `BACKLOG.md`, the journal README and an `AGENTS.md` backlog
  section. There is no flag to leave them out.
- Generation runs `delto bootstrap` to write the starter files. `create` does not ship its
  own copies in `skel/`.
- The `CLAUDE.md` wording in the journal README is fixed in delto itself; `create` does not
  rewrite bootstrap's output. The fix shipped the same day as `@limulus/delto` 1.4.1 (there
  is no 1.4.0): `bootstrap` names `AGENTS.md` when the directory has one, `CLAUDE.md`
  otherwise. So generation must run bootstrap after `AGENTS.md` has been copied in.
- The generated `AGENTS.md` backlog section covers what the delto spec defines and leaves
  out lemmon's `docs/plans/` convention.
- When `delto bootstrap` cannot run, for example with no network, `create` still finishes.
  It warns and tells the user the bootstrap command to run themselves.

Choices made while building, not settled by the brief:

- **A `DeltoBootstrap` class behind the `CLI.inject()` seam**, in
  `src/lib/DeltoBootstrap.ts`, with `src/mocks/DeltoBootstrapMock.ts` for `CLI.spec.ts`. Its
  `run(directory)` never throws: it resolves an `outcome` of `created`, `existing` or
  `failed`. `failed` carries a reason, the first non-empty line of the command's stderr, or
  of the error message when stderr is empty (a missing `npx` gives `spawn npx ENOENT`).
  `existing` means the directory already had a `BACKLOG.md`, so the command was not run:
  bootstrap would refuse there, and telling the user to run it would only fail again. The
  command and arguments are constructor parameters defaulting to
  `npx --yes @limulus/delto@1 bootstrap`, so `DeltoBootstrap.spec.ts` runs the real
  `execFile` path with `node -e` standing in for npx: no network, no npx. `--yes` stops npx
  asking before it installs delto into its cache.
- **The CLI runs it, not `PackageInitializer`**, right after `initialize()` and only when
  that succeeded, in the working directory. The CLI is where output is written, and
  `PackageInitializer.spec.ts` keeps exercising real copying without a network dependency.
  Bootstrap's own stdout (its "Next:" line) is discarded; the next-steps note says the same
  in this tool's words.
- **Fitted into ∆VNW's note rather than beside it.** `nextSteps(pkg, outcome)` gained a step
  right after `npm install`. On success it suggests installing the delto agent skill
  (`npx skills add limulus/delto`, which is what delto's own README and bootstrap output
  give) and says `AGENTS.md` describes the backlog. On failure it gives
  `npx @limulus/delto@1 bootstrap` and the skill command. For an existing `BACKLOG.md` it
  suggests the skill and says delto left that file as it was, with no warning. It comes
  before the review step so the backlog files exist before the first commit.
  `bootstrapCommand` is exported from `DeltoBootstrap.ts` and a spec ties it to the command
  actually run.
- **The warning goes to stderr** as one line,
  `Warning: delto could not set up the backlog: <reason>`, and the run exits 0.
- **A progress line on stdout**, `Setting up the backlog with delto...`, before running
  bootstrap. Measured offline, npx retries for about 70 seconds before failing; without the
  line `create` would sit silent that long. No timeout of its own: that would cut off a slow
  but working install, and npm's retry settings are the user's to tune.
- **The `AGENTS.md` section** sits before "Reviews": the item format, minting, briefs in
  `docs/briefs/`, `surface`, `claim`, `complete` (run while the item is still in
  `BACKLOG.md`, then fold the brief in and remove the item), `lint`, lemmon's "why is
  reliable, how is not" paragraph (general advice, not the `docs/plans/` handoff), and a
  pointer to the journal README for distillation. Wrapped at the generated project's
  Prettier width.
- **README:** a paragraph under Usage says every project starts with a delto backlog, that
  this is the one network call, what happens when it fails, and that an existing
  `BACKLOG.md` is kept. This repo's `AGENTS.md` names the `DeltoBootstrap` seam and the
  network call in its overview, and marks the network step in the end-to-end recipe.

## Refinement

Implemented as one commit, `feat: start generated projects with a delto backlog`.

Verification:

- `npm run verify`: lint clean with `--max-warnings 0`, 157 tests pass, 6 files at 100%
  statements, branches, functions and lines; `npm run build` exited 0.
- Negative tests: passing `'created'` instead of `backlog.outcome` to `nextSteps()` in
  `CLI.ts` failed "should give the bootstrap command as a next step" and the
  existing-backlog spec; a planted `skel/BACKLOG.md` failed "should leave writing the
  backlog to delto". Both probes were reversed by hand and the suite passed again.
- End to end with the real `npx @limulus/delto@1 bootstrap` (1.4.1): built `dist/` and ran
  `dist/bin/create.js --owner ctz-owner` in fresh scratch repositories for a private node, a
  private web (`--target web`), a `--public` scoped node and an unscoped web package. Each
  exited 0, printed the progress line and the success step, and wrote `BACKLOG.md` and
  `docs/journal/README.md`; the journal README names `AGENTS.md`. The generated `.gitignore`
  was byte-identical to the rendered template, so bootstrap found ∆6C4's claim-ledger line
  and added no duplicate. Each project then passed `npm install`, `npm run verify`,
  `npm run build` and `npx @limulus/delto@1 lint --journal-dir docs/journal`.
- The cannot-run path end to end: `create` run with
  `npm_config_registry=http://127.0.0.1:9/` and `npm_config_cache` pointing at an empty
  scratch directory, set for that process only. After about 70 seconds it printed
  `Warning: delto could not set up the backlog: npm error code ECONNREFUSED` on stderr and
  the bootstrap step in the note, wrote the rest of the project, wrote no `BACKLOG.md` or
  `docs/`, and exited 0. Running the suggested `npx @limulus/delto@1 bootstrap` there
  afterwards, with the normal environment, wrote both files.
- After review, the existing-backlog path end to end: in a scratch repository with a
  committed `BACKLOG.md`, `create` exited 0 with no warning, left that file unchanged, wrote
  no `docs/`, and gave the existing-backlog step. The created path (private node package)
  and the cannot-run path were run again with the same results as above; the created project
  passed `npm install`, `npm run verify`, `npm run build` and delto `lint`.

Notes for later work:

- delto's `BACKLOG.md` and journal README are wrapped at 92 columns, so a generated
  project's Prettier (100 columns) would rewrap them. Per the brief, `create` does not
  rewrite bootstrap's output; that belongs in delto if anywhere.
- `execFile('npx')` without a shell would not find `npx.cmd` on Windows; nothing here claims
  Windows support, so it was left.
- ∆Iod's CI generate-and-verify check will now depend on the npm registry for each
  generation; on a failure it still finishes, without the backlog files.

## Retrospective

The seam made this easy to test: putting the command and its arguments in the constructor
let the real `execFile` path run in specs with `node -e`, so only the npx default needed the
end-to-end check. The one thing worth remembering is that an unreachable registry costs
about 70 seconds of npm retries before npx gives up; measure such waits before deciding
whether a long-running step needs a progress line.
