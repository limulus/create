# Backlog

This backlog is managed with the [delto](https://github.com/limulus/delto) skill. Consult it
before adding or changing items.

## Refactors

Standing initiative. Keep it first, even when it has no items.

## Skeleton catch-up

menschen and lemmon were generated from this project and then improved by hand. Bring the
improvements that are not specific to either project back into `skel/`, and into this repo
where it shares the same tooling.

### Gate

- `∆Iod` Generate-and-verify check for the skeleton
  - Generate a project from `skel/` and run its `verify` and `build` in CI. Today no
    automated check notices a broken template, since `skel/` is excluded from every gate.
- `∆V8R` Fail lint on warnings
  - Prettier violations are warnings, so `eslint .` exits 0 on unformatted code, here and in
    generated projects. lemmon closed this with `--max-warnings 0`.

### Releases

- `∆ckk` Release config that honors `!` breaking commits
  - commitlint accepts `feat!:`, but semantic-release's default preset cannot parse that
    header and releases nothing. lemmon switched to the conventionalcommits preset.
- `∆PF8` Keep specs and mocks out of published tarballs
  - `files` ships all of `src`, spec files included. lemmon excludes `src/**/*.spec.ts` and
    `src/mocks`.
- `∆i4r` Trusted publishing for public packages
  - Publish to npm through OIDC with provenance, as lemmon does, in place of a long-lived
    `NPM_TOKEN` secret.
- `∆D1e` Leave GitHub Packages auth out of public packages
  - Every project gets an `@unallocate` registry `.npmrc` and a `GPR_READ_TOKEN` step in CI.
    A public package needs neither, and lemmon runs without them.

### Agent setup

- `∆cTZ` Start generated projects with a delto backlog
  - Ship `BACKLOG.md`, the journal README and an AGENTS.md backlog section. menschen and
    lemmon each added these by hand.
- `∆6C4` Ignore agent-local files in generated projects
  - `.claude/settings.local.json`, `.claude/worktrees/` and the delto claim ledger, which
    menschen's `.gitignore` gained one at a time.
- `∆H5o` Carry proven agent-guide rules into AGENTS.md
  - Rules the two projects' guides gained from mistakes: negative-test a new check, undo a
    probe by reversing it, and a push to `main` publishes a release.

## General availability as `@limulus/create`

Make this a tool anyone can use, published as `@limulus/create`. Today it is
`@unallocate/create` and writes Eric's own scopes, GitHub account and name into every
project it generates.

- `∆P8j` Remove built-in `@limulus` and `@unallocate` assumptions
  - Accept any full package name, read the GitHub owner from the repository, and take the
    author as an argument. Today all three are fixed to Eric's own.
- `∆vIB` Publish this tool as `@limulus/create`
  - Rename it from `@unallocate/create` and release it for general use.
  - needs: `∆P8j`
- `∆VNW` Print next steps after creating a project
  - A brief note on stdout or stderr saying what to do next and what to review. Today a
    successful run prints nothing.

## Workspace template

menschen and lemmon both became npm workspace monorepos, each set up by hand. Let `create`
scaffold that shape directly.

- `∆Oe3` Scaffold an npm workspace monorepo
  - One root toolchain over `packages/*`, as in lemmon: packages carry no scripts, and a
    sibling resolves to `src/` through a `source` export condition.
- `∆Van` Release workspace packages together at one version
  - lemmon's lockstep release: semantic-release sets every package's version, pins the
    sibling dependencies to it, and publishes them in order.
  - needs: `∆Oe3`
