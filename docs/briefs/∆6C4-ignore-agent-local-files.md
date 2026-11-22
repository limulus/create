# Ignore agent-local files in generated projects

## Background

Verified in the code on 2026-11-22. This item needed no decision from Eric.

- `skel/.gitignore.mustache` has none of the three entries: `.claude/settings.local.json`,
  `.claude/worktrees/` and `.delto-claims.local.jsonl`.
- menschen's `.gitignore` has all three, added in three separate commits. lemmon's has only
  the delto claim ledger.
- This repo's own `.gitignore` has the claim ledger and lacks the two `.claude` entries.
- On Eric's machine a global git ignore covers `.claude/settings.local.json`, which is why
  the file does not show as untracked here. Other people using a generated project will not
  have that.
- `delto bootstrap` adds the claim-ledger block itself, and skips it when the line is
  already present. `∆cTZ` has generation run bootstrap, so the ledger entry may arrive that
  way.
- The template must stay a `.mustache` file, because `npm pack` renames `.gitignore`.

## Implementation suggestions

From the research on 2026-11-22; the planner may drop them.

- If the ledger line goes into the template, use delto's exact comment and pattern, so that
  bootstrap recognises it as present.
