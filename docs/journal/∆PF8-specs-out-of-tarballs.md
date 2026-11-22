---
id: ∆PF8
completed: 2026-11-22 12:34:21 -07:00
---

## Backlog item

> - `∆PF8` Keep specs and mocks out of published tarballs
>   - `files` ships all of `src`, spec files included. lemmon excludes `src/**/*.spec.ts`
>     and `src/mocks`.

## Planning

A generated package listed `files` as `["dist", "src"]`. `src` ships on purpose: the build
emits source maps and declaration maps that point back at it. But that meant every spec
shipped too, starting with the template's own `src/lib/example.spec.ts`, and any mocks a
project later put in `src/mocks`. The template already treats both as non-shipping:
`skel/tsconfig.build.json` excludes `src/**/*.spec.ts` and `src/mocks/**/*` from `dist`, and
`skel/vitest.config.ts` leaves mocks out of coverage. lemmon's shell package solved the same
problem with negated patterns in `files` (`"!src/**/*.spec.ts"`, `"!src/mocks"`); its
journal records the tarball dropping from 299 kB to 182 kB. The brief recorded that the item
needed no decision from Eric, and one constraint: `create`'s own `files` (`dist`, `skel`)
must not gain a spec exclusion, because `skel/` has to ship whole, its example spec
included.

Done: the two negated patterns from lemmon's shell were added to `files` in
`skel/package.json.mustache`. The brief noted that nothing checked what a generated project
packs, so `PackageInitializer.spec.ts` gained a test that does: it generates a project,
plants a nested `src/mocks/deep/Deep.ts`, runs `npm pack --dry-run --json --ignore-scripts`
there, and expects exactly `src/index.ts` and `src/lib/example.ts` under `src`. Skipping
scripts means npm only computes the file list, so no install or build is needed (prepack
would otherwise build). `create`'s own `package.json` was left alone.

## Refinement

Verification:

- `create`: `npm run verify` (lint, test, tscc all exit 0; 77 tests, 100% coverage) and
  `npm run build` exit 0. Removing both negated patterns from the template made the new
  test fail, listing `src/lib/example.spec.ts` and `src/mocks/deep/Deep.ts`; the probe was
  reversed by restoring the file. `npm pack --dry-run` here still lists
  `skel/src/lib/example.spec.ts` (48 files), so the template ships whole.
- Generated a private node project (`@limulus/pf8priv`) and a public web project
  (`@limulus/pf8pub --public --target web`) from `dist/bin/create.js`; `npm install`,
  `npm run verify` and `npm run build` exited 0 in both. `files` does not vary by target or
  visibility, so these two cover the variants.
- In both, with probe files `src/mocks/Mock.ts` and `src/mocks/deep/Deep.ts` added,
  `npm pack --dry-run` listed only `src/index.ts` and `src/lib/example.ts` under `src` (12
  files private, 13 public with `LICENSE`). With the two negated patterns removed from the
  private project's `package.json`, the same command listed `src/lib/example.spec.ts` and
  both mock files (15 files); restoring them brought it back to 12.

No surprises: `"!src/mocks"` excludes the directory recursively, as in lemmon.

Review: the first version of the test asserted the rendered `files` array, which catches a
changed pattern but not whether npm honors it. I had ruled out running `npm pack` on the
grounds that it needed an install and build; `--ignore-scripts` removes both needs, and the
dry run takes about 0.2 s. The test now asserts the packed list instead.

## Retrospective

Small and well-specified by the brief; nothing to change. Probing with planted mock files,
including a nested one, was worth it, since the template has no `src/mocks` of its own to
show the pattern working.
