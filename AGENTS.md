# Create Project Helper Guide

## Project Overview

`@limulus/create` is a CLI that scaffolds a new TypeScript package into an existing, clean
git repository. Everything under `skel/` is the template: `PackageInitializer` copies that
tree into the target directory, stripping the `.mustache` suffix and rendering those files
against a `Package` instance.

Two things follow from that, and they are the most common source of mistakes:

- **`skel/` is not this project's source.** It is data. It is excluded from lint, coverage,
  and typecheck, so `npm run verify` will not tell you when a template breaks. Verify
  template changes with `npm run test:skel`, which generates projects and runs their
  `verify` (see Common Tasks).
- **Template changes are user-facing.** All changes to files in `skel/` are either features
  or bug fixes, so commits touching them use the `feat` or `fix` prefix — never `chore` or
  `refactor`.

After copying, the CLI runs `npx @limulus/delto@1 bootstrap` in the target to write the
starter backlog, through the injected `DeltoBootstrap` seam (specs use
`src/mocks/DeltoBootstrapMock.ts`, never npx). That is generation's one network call; when
it fails, generation still finishes with a warning.

## Commands

```bash
# The gate: eslint, vitest with coverage, and tsc. Run it after making changes — it is
# exactly what pre-push runs. Lint runs with --max-warnings 0, so any ESLint warning fails
# it. CI runs it too, then `npm run build` and `npm run test:skel`, so a change that is
# green here can still go red there on declaration emit or a broken template.
npm run verify

# Autofix lint. Run it first, then re-run verify — never concurrently with it, since it
# rewrites the same files verify is reading.
npm run lint:fix

# Test (single file)
npx vitest run src/lib/CLI.spec.ts

npm run build     # emit dist/ via the native compiler
npm run clean     # remove dist, coverage, *.tsbuildinfo
npm run tscc      # typecheck only

# Pack, generate every template variant from the tarball, and run each one's verify and
# build. Needs the network and a git identity, and takes about a minute. It stays out of
# verify and pre-push by design; CI runs it, and you run it after touching skel/.
npm run test:skel
```

## TypeScript Setup

Node runs `.ts` files directly via type stripping (v22.18+/v24), so imports name the real
file: `import x from './x.ts'`. Only the erasable subset of TypeScript survives that —
`erasableSyntaxOnly` is on to enforce it at compile time. It forbids:

- `enum` declarations — use an `as const` object plus a derived union type instead
- Parameter properties (`constructor(readonly foo: string) {}`) — declare the field and
  assign it in the constructor body
- `namespace` with runtime code, and `import =` aliases

`verbatimModuleSyntax` is also on, so any imported name used only as a type needs the `type`
keyword. Prefer inline specifiers over a separate statement:
`import Package, { type PackageTarget } from './Package.ts'`.

### Two tsconfigs

`tsconfig.json` is a single noEmit project over `src/**` (specs included), `scripts/**` and
the root config files — it is what `tscc`, editors, and typed lint use.
`tsconfig.build.json` emits `dist/` from non-spec `src/`. Keep them independent: a project
reference from `tsconfig.json` to the build config would make every typecheck emit `dist/`.
The cost of this split is that diagnostics raised only during declaration emit surface in
`npm run build` (CI runs it after `verify`), not in `tscc`.

### Two TypeScript packages

Typechecking and building run the TypeScript 7 native compiler through the `typescript-7`
npm alias, invoked by explicit path (`node node_modules/typescript-7/bin/tsc`) because both
packages ship a `tsc` bin and would collide on `.bin/tsc`. typescript-eslint deliberately
stays on the stable `typescript` package — it has no native-compiler support until the
stable API in TS 7.1. Don't "simplify" this arrangement.

## Testing

- **BDD with 100% coverage** — no exceptions. Prefer assertions over defensive programming;
  if you think you need a `/* v8 ignore … */`, pause and confirm with the user first
- **RSpec-style nesting** — `describe` for subject/context, `it('should …')` for assertions
- **Avoid `vi.mock()`** — the hand-written mocks in `src/mocks/` are injected through
  `CLI.inject()`, which is why that seam exists. Prefer exercising real dependencies
- **vitest 4 and later construct mock implementations with `new`.** An arrow function is not
  constructable, so `vi.fn().mockImplementation(() => ({ … }))` throws when the subject
  calls `new`. Supply the shape via `Mock.prototype`, or use a `function` expression when
  the implementation needs to throw
- **Negative-test a new check.** A test, lint rule or guard claimed to enforce an invariant
  proves nothing until it has failed: feed it a real violation, watch it fail, then remove
  the violation
- **Undo a probe by reversing the probe**, never with `git checkout -- <path>` or
  `git restore`: those restore the file from the index and silently discard every unstaged
  edit in it, not just the probe. Copy the file aside before a planned perturbation
- `PackageInitializer.spec.ts` asserts that specific `skel/` files land in the target
  directory. Renaming or removing a template file means updating those lists

## Code Style Guidelines

- **ESM**: Use ES Modules (`import/export`, not `require()`)
  - Use the `node:` prefix for Node.js built-ins
- **File Extensions**: Always include `.ts` in relative imports
- **Typing**: Use strict TypeScript typing, prefer interfaces for object types
  - Prefer explicit types over inference for public APIs
- **Semicolons**: Do not use semicolons to end statements (rely on ASI)
- **Naming**:
  - Classes: PascalCase
  - Methods/variables: camelCase
  - Files: PascalCase for modules whose default export is a class (`src/lib/` follows this),
    camelCase otherwise. Note that `skel/` uses kebab-case — generated projects follow the
    newer convention, and this project's existing filenames were left alone
- **Error Handling**: Use typed errors and proper propagation
- **Comments**:
  - Only add comments to explain _why_ code is doing something unusual or non-obvious
  - Avoid comments that merely describe _what_ the code is doing (the code already shows
    that)
  - Use JSDoc for public API documentation where appropriate
- Don't re-invent the wheel — prefer a well-used npm package over your own implementation
  that may miss important edge cases

## Project Structure

- `src/lib/` — core functionality
- `src/bin/` — CLI entry points
- `src/mocks/` — test mocks (not published)
- `skel/` — templates used to create new projects
- `scripts/` — `test:skel`, with its decisions in `scripts/lib/` under the same coverage
  rule as `src/lib/`

## Gotchas

- **`lint` pins its config explicitly** (`eslint . --config eslint.config.js`). ESLint 10
  looks up the nearest `eslint.config.js` per file, so a bare `eslint .` finds
  `skel/eslint.config.js` and lints the templates against a tsconfig that only exists after
  generation. The explicit `--config` keeps the run on the root config, where
  `globalIgnores` skips `skel/`

## Reviews

Review a plan before building it and the diff after; they find different things. A review
agent gets "do not modify files" in every prompt, and a verifier that must change the tree
to do its job gets its own git worktree — a verifier sharing the working tree once ran
`git checkout --` on a file it had probed and threw away the work in it.

## Committing

Do not run `git commit` unless the user has explicitly asked you to. The user reviews diffs
before they go in — landing work without a review denies them that step. Finishing a task
means the working tree is clean of uncommitted _unintended_ changes and `npm run verify`
passes — read `git diff` before saying so; staging and committing is a separate,
user-initiated step.

Do not push `main` unless the user asks, and never publish by hand. CI runs
`semantic-release` on every push, so pushing a commit that releases (see below) to `main`
publishes a new version.

## Commit Message Guidelines

Versions of this software are automatically determined by `semantic-release`. Follow
`conventionalcommits.org` standard, specifically the `@commitlint/config-conventional`
format.

- `feat: msg`: features
- `fix: msg`: bug fixes
- `refactor: msg`: code improvements that do not affect functionality
- `test: msg`: changes in tests only, does not affect functionality
- `docs: msg`: changes to documentation
- `ci: msg`: build pipeline
- `chore: msg`: updating dependencies, miscellany
- Breaking changes to exposed API surfaces must be documented with a footer/trailer. A `!`
  after the type or scope (`feat!: msg`) may also flag the change in the header, but only in
  addition to the footer, never in place of it. For example:

  ```
  feat: remove the `POST /api/spline/reticulate` endpoint

  BREAKING CHANGE: Support for previously deprecated spline reticulation
    has been removed. Use `POST /api/spline/frobnicate` instead.
  ```

- Scopes may also be used:
  - `feat(ui): increase button roundness`
  - `docs(readme): add frobnication section`
  - `chore(dev-deps): update dev dependencies`
  - `chore(deps): update dependencies`

Only certain commit messages will trigger changes to the semantic version of the software:

- A breaking change will trigger a major version bump, regardless of the prefix
- The `feat` prefix bumps the minor version
- The `fix` and `perf` prefixes bump the patch version
- A revert bumps the patch version. What marks a revert is the `This reverts commit <sha>.`
  body that `git revert` writes, not a `revert:` prefix on its own
- All other commit messages have no effect on the version

### Create Project Specific Guidelines

All changes to files in `skel/` are either features or bug fixes, so commits that include
such files should use either `fix` or `feat` prefixes.

## Common Tasks

```bash
# Verify a skel/ change end-to-end. Nothing in `npm run verify` runs the generated
# project's toolchain. This packs the tool as `npm publish` would, generates the private
# and public, node and web variants from that tarball in fresh git repositories under
# $TMPDIR, and runs `npm install`, `verify` and `build` in each. It runs every variant, then
# names each failed variant and step and leaves the projects in place for inspection.
npm run test:skel

# To poke at one generated project by hand instead:
npm run build
mkdir /tmp/scratch && cd /tmp/scratch
git init . && git commit --allow-empty -m init
git remote add origin https://github.com/example/scratch.git  # the GitHub owner comes from here
node /path/to/create/dist/bin/create.js scratch "A scratch package"  # needs the network
npm install && npm run verify && npm run build
```
