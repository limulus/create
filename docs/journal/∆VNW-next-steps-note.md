---
id: ∆VNW
completed: 2026-11-22 12:57:33 -07:00
---

## Backlog item

> - `∆VNW` Print next steps after creating a project
>   - A brief note on stdout or stderr, fitted to the options used, saying what to do next
>     and what to review. Today a successful run prints nothing.

## Planning

This section folds in the item's brief, written on 2026-11-22.

Verified in the code that day:

- On success `CLI.run()` wrote nothing. It wrote to stdout only for `--help` and to stderr
  only for errors.
- `PackageInitializer.initialize()` checks that the directory is a clean git repository and
  copies `skel/` into it. It does not run `npm install`, `git add` or `git commit`, and
  returns nothing, so it does not report which files it wrote.
- What a new project needs differs by option. `LICENSE` is generated only for a public
  package. A public package publishes through npm trusted publishing and holds no npm token;
  it needs the one-time npm setup in the README's "Setting up npm for a public package"
  section. A private package publishes with the built-in `GITHUB_TOKEN`.
- No generated project needs a repository secret set by the user.
- The generated workflow runs semantic-release on every push, so a releasing commit pushed
  to `main` publishes.
- `npm install` in a generated project installs its git hooks, through the `prepare` script.
- `ProcessMock` gives stdout and stderr as streams a spec can read.

Eric's decisions, 2026-11-22:

- After creating a project, `create` writes a note to stdout or stderr saying what to do
  next and what to review.
- The note is brief.
- The note varies with the options used. It names only the secrets and files that apply to
  the package created.
- The note warns that pushing a releasing commit to `main` publishes the package.
- The note tells the user to work on `main` from the start, as `∆oSa` decides. It does not
  mention a `v1-workspace` branch.

`∆i4r` and `∆D1e` had already settled which secrets and setup steps exist to be named.

Choices made while building, not settled by the brief:

- **stdout, after a successful `initialize()` only.** It is the normal output of a
  successful run; errors stay on stderr, and a failed run prints no note.
- **A separate `src/lib/nextSteps.ts`** with two functions: `nextSteps(pkg)` returns the
  steps as an array of strings, and `formatNextSteps(pkg, steps)` numbers them under a
  `Created <name>. Next steps:` heading, indenting continuation lines. `CLI.run()` calls
  both. Keeping the steps as an array is the seam a later item (`∆cTZ`) can use to append a
  line, such as its own warning, before formatting. Steps carry hand-placed line breaks so
  no line of the note passes 80 columns; the formatter keeps continuation lines aligned past
  nine steps.
- **Four steps:** run `npm install` (which installs the git hooks); review the generated
  files before committing them, naming `package.json`, `README.md`, `AGENTS.md`,
  `.github/workflows/cd.yaml`, and `LICENSE` only for a public package; what publishing
  needs; and "Work on main", with the warning that a `feat`, `fix` or breaking-change commit
  pushed to `main` publishes, starting at 1.0.0. `npm install` comes first so the commit-msg
  hook is in place before the first commit.
- **The publishing step differs by visibility.** Private: no secrets to add, CI publishes to
  GitHub Packages with the built-in `GITHUB_TOKEN` once the repository's default workflow
  permissions allow it (worded to match `∆oSa`'s README, since that was never tested).
  Public, including every unscoped package: no secrets to add, but npm must trust `cd.yaml`
  before the first release and nothing publishes until then, linking to the README section.
  The link is built at run time from the `homepage` in this tool's own `package.json`, with
  the section's anchor appended, rather than written out: `∆vIB` is renaming the package and
  moving the repository, and the link follows its metadata change without an edit here. A
  spec checks that this tool's README still has the heading the anchor names.
- **`--target` does not change the note.** Nothing a user has to do or review differs
  between the node and web targets.
- **README:** one paragraph under Usage says that `create` prints these next steps.
- **Tests without `vi.mock()`.** `nextSteps.spec.ts` uses real `Package` instances (private,
  `--public`, unscoped). `CLI.spec.ts` reads `ProcessMock`'s stdout for the success case and
  asserts it stays empty when `initialize()` rejects; `PackageMock`'s prototype gained
  `name` and `isPrivate` so the note can render from it.

## Refinement

Built as one commit, `feat: print next steps after creating a project`. It is `feat` rather
than `fix` because a successful run now prints output it did not before; nothing under
`skel/` changed.

The first draft had two note lines of 81 columns; they were rewrapped after seeing the real
output. The first commit attempt was rejected by commitlint because a body line passed 100
characters; the body was rewrapped.

Running Prettier over `README.md` also rewrapped the new paragraph to 92 columns (folded
into the feat commit) and fixed the file's pre-existing complaints. Those other fixes were
dropped, as in `∆i4r` and `∆oSa`, to keep the diff away from lines `∆vIB` is editing.

Verification:

- `npm run verify` (lint with `--max-warnings 0`, vitest with 100% coverage, tsc): 131 tests
  pass, 5 files fully covered. `npm run build` exited 0.
- Negative tests: inverting the `LICENSE` condition in `nextSteps.ts` failed three specs;
  moving the stdout write above `initialize()` in `CLI.ts` failed the "should not print the
  next steps when initializing fails" spec. Both probes were reversed by hand and the suite
  passed again.
- Built `dist/` and ran `dist/bin/create.js` in fresh scratch repositories for a private
  node, a `--public` scoped node, an unscoped web and a private web package. Each exited 0
  and printed the expected note: `LICENSE` and the npm setup only for the two public ones,
  `GITHUB_TOKEN` only for the private ones, no line over 80 columns. The private node and
  unscoped web projects then passed `npm install`, `npm run verify` and `npm run build`. The
  generated files themselves are unchanged by this item.

Review: the first build pointed to "the create README" by name, without saying where that
is; the reviewer flagged it as unclear to someone who only ran `npm init`. It now prints the
URL described above, which is 78 columns wide in the note. The reviewer also noted that
`CLI.spec.ts` only runs the private note through `run()`, since `PackageMock` is private;
the public branch is covered in `nextSteps.spec.ts` with real `Package` instances, so that
was left as is. After the change, `npm run verify` passed (133 tests, 5 files fully
covered), `npm run build` exited 0, and the built CLI printed the link for a `--public`
scoped and an unscoped package and the unchanged note for a private one. The `--public`
project then passed `npm install`, `npm run verify` and `npm run build`.

Left for others: `∆cTZ` adds its own line when `delto bootstrap` cannot run; the note does
not mention a backlog or delto.

## Retrospective

A small item; the code was obvious once the brief's decisions were in hand. The two things
worth keeping: look at real CLI output with a column count (`awk '{ print length }'`) rather
than trusting hand-wrapped string literals, and wrap commit bodies before committing, since
commitlint here rejects lines over 100 characters. Editing a string with an apostrophe
inside a single-quoted literal broke parsing once; switch the literal's quotes rather than
reach for a typographic apostrophe.
