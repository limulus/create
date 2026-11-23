# Backlog

This backlog is managed with the [delto](https://github.com/limulus/delto) skill. Consult it
before adding or changing items.

## Refactors

Standing initiative. Keep it first, even when it has no items.

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
