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

### Agent setup

## General availability as `@limulus/create`

Make this a tool anyone can use, published as `@limulus/create`. Today it is
`@unallocate/create` and writes Eric's own scopes, GitHub account and name into every
project it generates.

- `∆vIB` Publish this tool as `@limulus/create`
  - Rename it from `@unallocate/create`, move the repository to `limulus/create`, and
    publish it publicly to npm through trusted publishing.

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
