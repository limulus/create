# Start generated projects with a delto backlog

## Background

Verified in the code on 2026-11-22:

- Neither `skel/AGENTS.md.mustache` nor this repo's `AGENTS.md` mentions a backlog, delto, a
  journal or briefs.
- `delto bootstrap` (`@limulus/delto` 1.3.0) writes three things: a `BACKLOG.md` with the
  preamble and the Refactors initiative, `docs/journal/README.md` with a "Last distilled"
  watermark set to the moment it runs, and a `.gitignore` block for the claim ledger. It
  refuses to run where a `BACKLOG.md` exists, and it skips the `.gitignore` block when the
  line is already there.
- delto 1.3.0's journal README names `CLAUDE.md` in its distillation section. Generated
  projects have `AGENTS.md`. In this repo the README was edited by hand to say `AGENTS.md`.
- `create` makes no network call and runs no other tool today. `PackageInitializer` checks
  that the directory is a clean git repository and copies `skel/` into it.
- lemmon's guide has a "Backlog & journal (delto)" section covering the item format, briefs,
  `surface`, `claim`, `complete`, and minting with `npx @limulus/delto@1 mint`. It also
  describes a `docs/plans/` handoff, which is lemmon's own convention and not in the delto
  spec.
- menschen's "Backlog & Progress Tracking" section predates the current delto spec.

## Scope and constraints

Eric's decisions, 2026-11-22:

- Every generated project gets `BACKLOG.md`, the journal README and an `AGENTS.md` backlog
  section. There is no flag to leave them out.
- Generation runs `delto bootstrap` to write the starter files. `create` does not ship its
  own copies in `skel/`.
- The `CLAUDE.md` wording in the journal README is fixed in delto itself. `create` does not
  rewrite bootstrap's output.
- The generated `AGENTS.md` backlog section covers what the delto spec defines and leaves
  out lemmon's `docs/plans/` convention.
- When `delto bootstrap` cannot run, for example with no network, `create` still finishes.
  It warns and tells the user the bootstrap command to run themselves.

The delto fix was released on 2026-11-22 as `@limulus/delto` 1.4.1: `bootstrap` names
`AGENTS.md` when the directory it runs in has one, and `CLAUDE.md` otherwise. There is no
1.4.0 on npm. Generation must run bootstrap after `AGENTS.md` has been copied in.
