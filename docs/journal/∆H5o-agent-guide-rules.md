---
id: ∆H5o
completed: 2026-11-22 12:44:13 -07:00
---

## Backlog item

> - `∆H5o` Carry proven agent-guide rules into AGENTS.md
>   - Five rules the two projects' guides gained from mistakes, such as negative-testing a
>     new check, undoing a probe by reversing it, and that a push to `main` publishes.

## Planning

menschen and lemmon were generated from this project, and their agent guides gained rules
the skeleton's `AGENTS.md` lacked, each written after a mistake. lemmon's `CLAUDE.md` states
them most fully: negative-test a check claimed to enforce an invariant; undo a probe by
reversing it, never with `git checkout -- <path>`, which had cost three sessions their work;
push `main` only when asked, since a push of a releasing commit publishes (menschen says the
same: "Do not push: pushing `main` triggers `semantic-release`"); read `git diff` before
calling a task finished; and review a plan before building it and the diff after, with a
review agent told not to modify files and a mutating verifier given its own worktree.
Generated projects run semantic-release on every push, private and public alike, so the push
rule applies to every variant. The skeleton's existing shared rules (100% coverage, RSpec
nesting, avoiding `vi.mock`, not committing unasked) needed nothing.

Eric's decisions (2026-11-22): exactly those five rules are in scope; menschen's dual-loop
TDD "Development Philosophy" and its discipline rules stay out; correcting the guides' list
of commit types that release belongs to `∆ckk`, not this item.

Done: `skel/AGENTS.md.mustache` and this repo's `AGENTS.md` got the same text. Testing
gained two bullets (negative-test a new check; undo a probe by reversing it, copying the
file aside before a planned perturbation). A new Reviews section, before Committing, holds
the plan-and-diff review rule and its two safeguards. Committing now says to read `git diff`
before calling a task finished, and gained a paragraph: do not push `main` unless the user
asks, never publish by hand, because CI runs `semantic-release` on every push and a
releasing commit pushed to `main` publishes.

Choices made here:

- lemmon's project-specific wording was stripped ("Eric", "three sessions", "both
  packages"); the guides say "the user", as the skeleton already did.
- The push rule says "a commit that releases (see below)" and points at the existing
  version-bump list instead of naming commit types, so it stays right whatever `∆ckk` does
  to that list, and this item leaves the list untouched.
- lemmon's "name which gates ran" was dropped: it exists because lemmon has gates outside
  `verify`, and a generated project has one gate.
- The probe rule names `git restore` alongside `git checkout --`, since both restore the
  file from the index and so discard unstaged edits the same way.
- Reviews became its own section rather than a Committing bullet, since it concerns how work
  is checked before any commit; the text is kept as one paragraph.

## Refinement

Verification:

- `npm run verify` exit 0 (lint, tscc, 81 tests, 100% coverage) and `npm run build` exit 0
  in the worktree.
- Generated a private node project (`scratch`) and a public web project
  (`@limulus/scratch --target web --public`) from this worktree's `dist/bin/create.js`. Each
  `AGENTS.md` matched the template line for line apart from the rendered title, and
  `npm install && npm run verify && npm run build` passed in both. The template has no
  variant conditionals, so these two cover it.
- No check or guard was added, so there was nothing to negative-test.

`npx prettier --check` flags one pre-existing paragraph in both guides (the "Two tsconfigs"
line break inside `` `npm run build` ``), in the generated guide as well. It predates this
item and was left alone.

## Retrospective

Small and unsurprising. Pointing the push rule at the version-bump list rather than
restating it avoided a merge conflict with `∆ckk`, which owns that list; doing the same
whenever two items touch neighbouring text in a guide is worth keeping.
