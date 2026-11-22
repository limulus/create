# Print next steps after creating a project

## Background

Verified in the code on 2026-11-22:

- On success `CLI.run()` writes nothing. It writes to stdout only for `--help` and to stderr
  only for errors.
- `PackageInitializer.initialize()` checks that the directory is a clean git repository and
  copies `skel/` into it. It does not run `npm install`, `git add` or `git commit`, and it
  returns nothing, so it does not report which files it wrote.
- What a new project needs differs by option. `LICENSE` is generated only for a public
  package. The publish step uses the `NPM_TOKEN` secret for a public package and the
  built-in `GITHUB_TOKEN` for a private one.
- The generated workflow runs semantic-release on every push, so a releasing commit pushed
  to `main` publishes.
- `README.md` documents the steps after creation as `npm install`, then merging a
  `v1-workspace` branch into `main` for the first release.
- `npm install` in a generated project installs its git hooks, through the `prepare` script.
- `ProcessMock` gives stdout and stderr as streams a spec can read.

## Scope and constraints

Eric's decisions, 2026-11-22:

- After creating a project, `create` writes a note to stdout or stderr saying what to do
  next and what to review.
- The note is brief.
- The note varies with the options used. It names only the secrets and files that apply to
  the package created.
- The note warns that pushing a releasing commit to `main` publishes the package.
- The note tells the user to work on `main` from the start, as `∆oSa` decides. It does not
  mention a `v1-workspace` branch.

Which secrets and setup steps exist to be named depends on `∆i4r` and `∆D1e`.

## Implementation suggestions

From the research on 2026-11-22; the planner may drop them.

- Write through the existing `Process` seam in `CLI.ts` and assert on `ProcessMock`'s
  streams in `CLI.spec.ts`, which keeps full coverage without `vi.mock`.
