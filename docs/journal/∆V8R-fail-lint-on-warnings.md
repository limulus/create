---
id: ∆V8R
completed: 2026-11-22 12:28:46 -07:00
---

## Backlog item

> - `∆V8R` Fail lint on warnings
>   - Every ESLint warning, Prettier violations included, leaves `eslint .` exiting 0, here
>     and in generated projects. lemmon closed this with `--max-warnings 0`.

## Planning

Neither `create` (`eslint . --config eslint.config.js`) nor the template (`eslint .`) capped
warnings, so any warning-level violation left lint, and with it `verify`, pre-push and CI,
green. `eslint-config-universe`, under `@limulus/eslint-config`, sets most of its core rules
to `warn`, and `@limulus/eslint-config` adds `no-void` as a warning, so this was not only
about formatting. lemmon closed the same gap in its commit `459c324` by adding
`--max-warnings 0` to its `lint` script, and that is the decision this item follows. The
brief recorded that nothing warned at the time and that the item needed no decision from
Eric. `lint:fix` in both places is `npm run lint -- --fix`, so it inherits the flag; that is
fine because `--fix` still writes its fixes before the warning count is checked.

Done: `--max-warnings 0` added to `lint` in `package.json` and `skel/package.json.mustache`,
and one sentence added to the gate comment in `AGENTS.md` and `skel/AGENTS.md.mustache`
saying that any ESLint warning fails lint. That sentence was my call: an agent that sees
`verify` fail on a warning should not have to work out why. It deliberately does not promise
that formatting fails lint; see the surprise below.

## Refinement

Verification:

- `create`: `npm run verify` and `npm run build` exit 0. Planting extra spaces in
  `src/bin/create.ts` made `npm run lint` exit 1 ("ESLint found too many warnings (maximum:
  0)") and `verify` exit 1, while the old command exited 0. The probe was reversed by edit.
- Generated four projects from `dist/bin/create.js` (node and web, private and public);
  `npm install`, `npm run verify` and `npm run build` exited 0 in each.
- In the generated node/private project a planted `debugger` statement (a `no-debugger`
  warning) made `npm run lint` and `verify` exit 1, while bare `eslint .` exited 0.

Surprise: the Prettier half of the item does not hold in freshly generated projects. A
planted formatting violation there produced no warning at all. Generated projects have no
lockfile, so they resolve `eslint-config-universe` 16.1.2, whose `flat/shared/prettier.js`
sets `prettier/prettier` to `off`; `create`'s lockfile (and lemmon's) pins 16.0.0, which
sets it to `warn`. So `create` still fails lint on formatting, but only until its lockfile
moves past 16.0.x, and generated projects already do not. `--max-warnings 0` cannot catch a
rule that is off. Restoring formatting enforcement (re-enabling the rule in
`@limulus/eslint-config` or the template's `eslint.config.js`, or adding `prettier --check`
to `lint`) is a choice for Eric and was left out of this item. `prettier --check` would also
catch the unformatted `skel/.vscode/extensions.json` that the brief noted ESLint never sees.

## Retrospective

The brief's claim that the template's Prettier violations warn was checked against
`create`'s installed dependencies, not against what a generated project resolves. Negative
tests in a generated project, not only in this repository, are what exposed the difference;
keep doing both when a template change depends on a shared config's behavior.
