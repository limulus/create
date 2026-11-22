# Keep specs and mocks out of published tarballs

## Background

Verified in the code on 2026-11-22. This item needed no decision from Eric.

- A generated package publishes all of `src` beside `dist`: `files` in
  `skel/package.json.mustache` is `["dist", "src"]`.
- `src` ships because the build emits source maps and declaration maps that point back at
  it.
- The template's `src` holds a spec, `src/lib/example.spec.ts`, which ships today. It has no
  `src/mocks` directory, but the template already treats that path as a convention:
  `skel/tsconfig.build.json` excludes specs and `src/mocks` from `dist`, and coverage
  excludes mocks.
- lemmon uses negated patterns in `files`: `"!src/**/*.spec.ts"` and `"!src/mocks"`. Its
  journal records the shell's tarball dropping from 299 kB to 182 kB.
- `create`'s own package is not affected. Its `files` are `dist` and `skel`, and `skel/`
  must ship whole, its example spec included. A spec exclusion must not be added to
  `create`'s own `files`.
- No test checks what a generated project packs.

## Implementation suggestions

From the research on 2026-11-22; the planner may drop them.

- Mirror lemmon's shell package: add the two negated patterns to `files` in
  `skel/package.json.mustache`.
- Check the result with `npm pack --dry-run` in a generated project.
