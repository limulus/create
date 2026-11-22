# Scaffold an npm workspace monorepo

## Background

Verified in the code on 2026-11-22:

- `create` has one template. `PackageInitializer` takes its source from a single hardcoded
  path, `skel/`, and copies the whole tree. Its only conditional file is `LICENSE.mustache`.
- The CLI parses `--help`, `--target` and `--public`, plus a name and a description.
  `Package` has no notion of a layout.
- lemmon's shape:
  - The root `package.json` is `"private": true` with `workspaces: ["packages/*"]`. Every
    script is at the root, and the packages have no `scripts` field.
  - `tsconfig.base.json` sets `customConditions: ["source"]`, so a sibling typechecks
    against `src/`. The root `tsconfig.build.json` only references each package's build
    config.
  - Each package has a noEmit `tsconfig.json` over `src/**` and a composite
    `tsconfig.build.json` that emits `dist/esm` and `dist/types`.
  - Each package's `exports` lists `"source": "./src/index.ts"` before `types` and `import`.
  - `vitest.config.ts` lists its projects inline with `extends: true`, because a bare
    `packages/*` glob would drop the root options. It sets `ssr.resolve.conditions` so that
    specs import siblings from `src/`.
  - One root `eslint.config.js` covers every package.
  - Its guide gives the recipe for a new package: copy `package.json` and both tsconfigs
    from an existing one, then add it to the root `tsconfig.build.json` references and to
    the package list in `vitest.config.ts`.
- lemmon's base config still has `importHelpers` and its packages depend on `tslib`.
  `create` removed both from itself and from `skel/` in commit `3a50f13`.
- lemmon's base config hardcodes NodeNext. `--target` switches the generated tsconfig
  between NodeNext and bundler resolution.
- menschen's workspace is a different shape. Its packages carry their own scripts, and its
  internal packages are private and export `src/` files directly, with no `source`
  condition.
- `PackageInitializer.spec.ts` asserts which template files land in the target, so a second
  template tree needs its own list there.

## Scope and constraints

Eric's decisions, 2026-11-22:

- The workspace shape is an option of the existing `create` command. Today's single-package
  output stays the default and does not change.
- A generated workspace starts with exactly one package under `packages/`, named by the
  package-name argument, under a private root. The generated `AGENTS.md` documents how to
  add a sibling.
- The template follows lemmon's shape only: a root-only toolchain, no package scripts, and
  every package exporting through a `source` condition beside its built `dist/`. menschen's
  per-package scripts and `src`-exporting internal packages are out of scope.

Everything in lemmon that is Rust or wasm is out of scope.

## Implementation suggestions

From the research on 2026-11-22; the planner may drop them.

- Do not copy lemmon's `importHelpers` and `tslib`.
- Selecting a second template directory in `PackageInitializer` is the narrowest change, and
  keeps the copy, rename and render pipeline.
- With one package, nothing exercises the sibling wiring (`customConditions`, the vitest
  conditions, project references) until a second package is added.
