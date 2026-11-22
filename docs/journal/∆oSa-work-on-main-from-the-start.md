---
id: ∆oSa
completed: 2026-11-22 12:51:43 -07:00
---

## Backlog item

> - `∆oSa` Work on main from the start
>   - Drop the README's `v1-workspace` branch step, so that a new project is worked on
>     directly on `main`.

## Planning

This section folds in the item's brief, written on 2026-11-22. Eric asked that day to get
away from the `v1-workspace` branch concept: a new package does not get published without
manual setup, so it is fine to work on `main` immediately.

Verified in the code that day:

- `README.md` told the user to run `git checkout -b v1-workspace` before `npm init`, and to
  merge `v1-workspace` into `main` when ready for an initial release. Nothing else in the
  repo named the branch.
- The generated workflow runs semantic-release on every push.
- For a public package, since `∆i4r`, nothing publishes until the package exists on npm and
  its trusted publisher is configured.
- For a private package the generated workflow passes the built-in `GITHUB_TOKEN` as the
  publish token and has no `permissions` block. Whether a first releasing push publishes
  depends on the repository's default token permissions. This was not tested.

Eric's decisions, 2026-11-22:

- The `v1-workspace` branch step goes away. A new project is worked on directly on `main`.
- This applies to every package, private ones included.
- The next-steps note (`∆VNW`) reflects this.
- Nothing is added to stop a private package's first `feat` or `fix` push to `main` from
  publishing 1.0.0 to GitHub Packages. That is accepted. The README and the next-steps note
  warn that a releasing commit on `main` publishes.

Choices made while building, not settled by the brief:

- **README only.** No template, workflow or CLI code named the branch, so nothing under
  `skel/` or `src/` changed, and the commit is `docs(readme)` rather than `feat` or `fix`.
  The next-steps note is left entirely to `∆VNW`.
- **A "Releasing" subsection replaces the closing merge sentence**, at the end of the Usage
  section where the old sentence sat. It says to work on `main`, that a releasing commit
  (`feat`, `fix`, or any breaking change) pushed to `main` publishes, starting at 1.0.0,
  that a private package can publish to GitHub Packages on its first such push as soon as
  the repository's default token permissions allow it, and that a public package publishes
  nothing until the npm setup above is done. It does not claim what a public package's
  publish job does before that setup (whether it fails or is skipped), since that was not
  exercised.
- **Minimal neighbouring edits.** The `npm init @unallocate` lines, which `∆vIB` renames,
  were left untouched. Deleting the `git checkout` line directly above the first of them
  still leaves the two changes adjacent, so git may report a conflict there when both merge;
  resolving it means keeping `∆vIB`'s line and dropping the checkout line.
- **Prettier's pre-existing complaints in `README.md` were left alone**, as in `∆i4r`: a
  trailing space, a missing blank line before a list, two paragraphs wrapped narrower than
  92 columns, and the missing final newline. The new lines themselves match Prettier's
  output.

## Refinement

Built as one commit,
`docs(readme): work on main from the start instead of a v1-workspace branch`.

Review found that the first draft stated as fact that a private package publishes on its
first releasing push, which the planning notes record as untested: the private workflow has
no `permissions` block, so it depends on the repository's default token permissions. The
sentence now says a private package _can_ publish as soon as those permissions allow it.
Review also noted that `∆VNW`'s brief still describes the old merge flow in its Background;
that brief belongs to `∆VNW` and was left for it.

Verification:

- `git grep -i v1-workspace` outside `docs/` and `BACKLOG.md` finds nothing after the
  change.
- `npx prettier README.md` diffed against the file shows only the pre-existing differences
  listed above, none in the new subsection.
- `npm run verify` (lint, vitest with 100% coverage, tsc) and `npm run build` both exited 0.
  No generated project was built, because nothing that affects generation changed.

## Retrospective

A small item whose brief had already done the searching; the only judgment left was how far
the warning should go. The draft avoided guessing at a public package's CI behavior before
npm setup, yet still stated the private case as fact although the brief had marked it
untested. Checking each README claim against what the planning notes say was verified, not
just the claims that felt uncertain, would have caught it before review.
