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
  - Pack `create`, generate each variant from the tarball and run its `verify` and `build`
    in CI. Today no automated check notices a broken template.

### Releases

- `∆PF8` Keep specs and mocks out of published tarballs
  - `files` ships all of `src`, spec files included. lemmon excludes `src/**/*.spec.ts` and
    `src/mocks`.

### Agent setup

- `∆cTZ` Start generated projects with a delto backlog
  - Run `delto bootstrap` while generating, and add a backlog section to the generated
    AGENTS.md. menschen and lemmon each set these up by hand.
- `∆6C4` Ignore agent-local files in generated projects
  - `.claude/settings.local.json`, `.claude/worktrees/` and the delto claim ledger, which
    menschen's `.gitignore` gained one at a time.
- `∆H5o` Carry proven agent-guide rules into AGENTS.md
  - Five rules the two projects' guides gained from mistakes, such as negative-testing a new
    check, undoing a probe by reversing it, and that a push to `main` publishes.

## General availability as `@limulus/create`

Make this a tool anyone can use, published as `@limulus/create`. Today it is
`@unallocate/create` and writes Eric's own scopes, GitHub account and name into every
project it generates.

- `∆vIB` Publish this tool as `@limulus/create`
  - Rename it from `@unallocate/create`, move the repository to `limulus/create`, and
    publish it publicly to npm through trusted publishing.
- `∆VNW` Print next steps after creating a project
  - A brief note on stdout or stderr, fitted to the options used, saying what to do next and
    what to review. Today a successful run prints nothing.
- `∆oSa` Work on main from the start
  - Drop the README's `v1-workspace` branch step, so that a new project is worked on
    directly on `main`.

## Workspace template

menschen and lemmon both became npm workspace monorepos, each set up by hand. Let `create`
scaffold that shape directly.

- `∆Oe3` Scaffold an npm workspace monorepo
  - An option of `create` that generates one root toolchain over `packages/*`, as in lemmon,
    starting with one package. The single-package output stays the default.
- `∆Van` Release workspace packages together at one version
  - lemmon's lockstep release: semantic-release sets the version of every package that
    publishes, pins sibling dependencies to it, and publishes them in order.
  - needs: `∆Oe3`
