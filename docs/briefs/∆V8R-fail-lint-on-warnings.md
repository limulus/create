# Fail lint on warnings

## Background

Verified in the code on 2026-11-22. This item needed no decision from Eric.

- `create` lints with `eslint . --config eslint.config.js`, and the template with
  `eslint .`. Neither caps warnings. `lint:fix` in both is `npm run lint -- --fix`, so it
  inherits any flag added to `lint`.
- `eslint-config-universe`, which `@limulus/eslint-config` builds on, sets
  `prettier/prettier` to `warn`.
- Prettier is not the only warning. Universe sets most of its core rules to `warn`, and
  `@limulus/eslint-config` adds `no-void` as a warning. `--max-warnings 0` fails lint on any
  of them, not only on formatting.
- Nothing warns today. `create` passes
  `eslint . --config eslint.config.js --max-warnings 0`, and the template's lintable sources
  report no errors and no warnings.
- lemmon made this change in commit `459c324`, to its `lint` script only. Its message
  records a planted violation that exited 0 before and 1 after.
- `prettier --check` flags `skel/.vscode/extensions.json` as unformatted. ESLint does not
  lint JSON here, so this change will not catch it.

## Implementation suggestions

From the research on 2026-11-22; the planner may drop them.

- Repeat lemmon's negative test: plant a formatting violation and confirm lint exits 1 after
  the change.
