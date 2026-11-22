# Work on main from the start

## Background

Eric asked on 2026-11-22 to get away from the `v1-workspace` branch concept. His reasoning:
a new package does not get published without manual setup, so it is fine to work on `main`
immediately.

Verified in the code that day:

- `README.md` tells the user to run `git checkout -b v1-workspace` before `npm init`, and to
  merge `v1-workspace` into `main` when ready for an initial release. Nothing else in the
  repo names the branch.
- The generated workflow runs semantic-release on every push.
- For a public package, since `∆i4r`, nothing publishes until the package exists on npm and
  its trusted publisher is configured.
- For a private package the generated workflow passes the built-in `GITHUB_TOKEN` as the
  publish token and has no `permissions` block. Whether a first releasing push publishes
  depends on the repository's default token permissions. This was not tested.

## Scope and constraints

Eric's decisions, 2026-11-22:

- The `v1-workspace` branch step goes away. A new project is worked on directly on `main`.
- This applies to every package, private ones included.
- The next-steps note (`∆VNW`) reflects this.
- Nothing is added to stop a private package's first `feat` or `fix` push to `main` from
  publishing 1.0.0 to GitHub Packages. That is accepted. The README and the next-steps note
  warn that a releasing commit on `main` publishes.
