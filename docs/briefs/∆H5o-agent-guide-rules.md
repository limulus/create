# Carry proven agent-guide rules into AGENTS.md

## Background

Verified in the code on 2026-11-22:

- `skel/AGENTS.md.mustache` has Commands, TypeScript Setup, Testing, Code Style, Project
  Structure, Committing and Commit Message Guidelines sections. It has none of the rules
  below.
- Its Committing section already says that finishing a task means a working tree clean of
  unintended changes and `npm run verify` passing.
- Generated projects run semantic-release on every push, for private and public packages
  alike, so a releasing commit pushed to `main` publishes.
- The rules as lemmon's `CLAUDE.md` states them:
  - Testing: "A check claimed to enforce an invariant is negative-tested first: feed it a
    real violation and watch it fail."
  - Testing: "Undo a probe by reversing the probe, never with `git checkout -- <path>`",
    which it says has cost three sessions their work, and "Copy the file aside before a
    planned perturbation".
  - Layout: a push to `main` of a commit that releases publishes the packages, "so push main
    only when Eric asks, and never publish by hand". menschen has "Do not push: pushing
    `main` triggers `semantic-release`".
  - Committing: "read `git diff` before saying so, and name which gates ran". The second
    half exists because lemmon has gates outside `verify`. A generated project has one gate.
  - Working agreements: "Review a plan before building it and the diff after; they find
    different things. A review agent gets "do not modify files" in every prompt, and a
    verifier that must mutate the tree gets its own worktree: one ran `git checkout --` on a
    file it probed."
- The existing skeleton rules (100% coverage, RSpec nesting, avoiding `vi.mock`, not
  committing unless asked) are already shared by both projects and need no carrying over.

## Scope and constraints

Eric's decisions, 2026-11-22:

- Five rules are in scope:
  - negative-test a new check;
  - undo a probe by reversing it;
  - a push to `main` publishes a release;
  - read `git diff` before calling a task finished;
  - review a plan before building it and the diff after, with the two safeguards for review
    and verifier agents.
- menschen's dual-loop TDD "Development Philosophy" and its discipline rules stay out.
- Correcting the list of commit types that release belongs to `∆ckk`, not to this item.

## Implementation suggestions

From the research on 2026-11-22; the planner may drop them.

- Strip lemmon's own wording ("Eric", "three sessions", "both packages") when carrying a
  rule over. The skeleton already says "the user".
- This repo's `AGENTS.md` has the same Committing section as the skeleton, and the epic
  covers this repo where it shares the same tooling.
