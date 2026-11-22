---
id: ∆6C4
completed: 2026-11-22 12:39:57 -07:00
---

## Backlog item

> - `∆6C4` Ignore agent-local files in generated projects
>   - `.claude/settings.local.json`, `.claude/worktrees/` and the delto claim ledger, which
>     menschen's `.gitignore` gained one at a time.

## Planning

Generated projects' `.gitignore` (`skel/.gitignore.mustache`, a mustache file only because
`npm pack` renames `.gitignore`) covered none of the files that coding agents leave in a
working tree: Claude Code's `.claude/settings.local.json` and `.claude/worktrees/`, and
delto's `.delto-claims.local.jsonl` claim ledger. menschen gained all three in separate
commits as each one turned up untracked; lemmon has only the ledger. On Eric's machine a
global git ignore hides `.claude/settings.local.json`, which is why it never showed here,
but other people using a generated project have no such rule. The brief recorded that the
item needed no decision from Eric.

Done: the three entries were appended to the template, each with a comment. The ledger entry
uses delto's exact comment and pattern
(`# Delto plan-backlog-item claim ledger (sits alongside BACKLOG.md)`, taken from delto's
`src/lib/gitignore.ts`), so `delto bootstrap`, which `∆cTZ` may have generation run, sees it
as present and adds nothing. `PackageInitializer.spec.ts` gained a "the generated
.gitignore" block that runs `git check-ignore` in a freshly generated project: each of the
three paths must be ignored (exit status 0), and `.claude/settings.json` must not be (exit
status 1, so a git error cannot pass for "not ignored"), since shared Claude Code settings
belong in the repository.

Choices made here:

- Ignore the two specific `.claude` paths rather than `.claude/` as a whole, for the same
  reason as the `settings.json` test.
- The tests pass `-c core.excludesFile=/dev/null` to git, so a developer's global ignore
  (Eric's covers `settings.local.json`) cannot make them pass without the template's help.
- The worktree test checks a path inside `.claude/worktrees/`, since the pattern is a
  directory pattern.
- This repo's own `.gitignore` still lacks the two `.claude` entries; it was left alone as
  outside the item, which is about generated projects.

## Refinement

Verification:

- `npm run verify` exit 0 (lint, tscc, 81 tests, 100% coverage) and `npm run build` exit 0.
- Negative tests: commenting out the `.claude/worktrees/` line in the template failed only
  the worktree test; appending `.claude/` failed only the `settings.json` test. Both probes
  were reversed by editing the line back.
- Generated a private node project (`scratch`) and a public web project
  (`@limulus/scratch --public --target web`) from `dist/bin/create.js`; `npm install`,
  `npm run verify` and `npm run build` exited 0 in both. The template has no mustache
  variables in it, so `.gitignore` is the same for every variant.
- In the private project, after committing the generated files and creating
  `.claude/settings.local.json`, `.claude/worktrees/x/a`, `.delto-claims.local.jsonl` and
  `.claude/settings.json`, `git -c core.excludesFile=/dev/null status --untracked-files=all`
  listed only `.claude/settings.json`. `npx @limulus/delto@1 bootstrap` there wrote
  `BACKLOG.md` and `docs/journal/README.md` but left `.gitignore` alone, with the ledger
  line appearing once.

## Retrospective

A small item that went as planned. The one trap was the global ignore on Eric's machine: a
plain `git check-ignore` test would have passed for `settings.local.json` even without the
template change, so tests about ignore rules should switch off global excludes.
