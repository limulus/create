---
id: ∆vIB
completed: 2026-11-22 23:03:58 -07:00
---

## Backlog item

> - `∆vIB` Publish this tool as `@limulus/create`
>   - Rename it from `@unallocate/create`, move the repository to `limulus/create`, and
>     publish it publicly to npm through trusted publishing.

## Planning

The value: anyone can run `npm init @limulus` to scaffold a package, where the tool was
published privately for Eric's own use.

What the brief recorded, verified in the code on 2026-11-22:

- The package was named `@unallocate/create`. Its `repository`, `bugs` and `homepage` URLs
  pointed at `github.com/unallocate/create`, as did the git remote.
- `publishConfig.registry` was GitHub Packages, with no `access` field. CI published with
  semantic-release, passing `GITHUB_TOKEN` as the npm token. That token can publish only to
  GitHub Packages, under a scope that matches the repository owner, and GitHub Packages
  needs a token even to install a public package.
- `bin` is the string `dist/bin/create.js`, so `npm init @limulus` resolves to the package
  `@limulus/create`.
- The repository had 44 release tags in semantic-release's default `v${version}` format, the
  latest `v1.23.0`. With no `tagFormat` override, the renamed package continues from there.
- lemmon's rule for a retired name: it gets no alias and no deprecation message, and its
  commit is a breaking change released as a major.

Eric's decisions, 2026-11-22:

- `@limulus/create` publishes to the public npm registry through trusted publishing, not to
  GitHub Packages, and this repository's own release workflow moves to trusted publishing in
  this item.
- The repository moves from `github.com/unallocate/create` to `github.com/limulus/create`,
  and the `repository`, `bugs` and `homepage` URLs in `package.json` follow.
- `@unallocate/create` is left as it is: no final release, no alias and no deprecation
  message.
- The first `@limulus/create` release is a new major, 2.0.0.

`∆P8j` had landed first, so the tool no longer wrote Eric's own scopes, GitHub account and
name into what it generates, and its commit already carried a `BREAKING CHANGE:` footer.
`∆D1e` had removed the root `.npmrc` and the `GPR_READ_TOKEN` step.

## Refinement

Built as one commit, `feat: publish as @limulus/create to the public npm registry`, with a
`BREAKING CHANGE:` footer. It renames the package, points the URLs at
`github.com/limulus/create`, sets `publishConfig` to the public registry with
`access: public` and the trailing slash `@semantic-release/npm` needs (see `∆i4r`), and
gives the publish job in `continuous-release.yaml` the four permissions trusted publishing
takes, dropping `NPM_TOKEN`. The branch was held until the rollout, then rebased twice as
`main` moved; the only conflicts were in the README's usage lines.

The rollout, done by Eric with the release itself run from here:

1. The repository was transferred to `limulus/create` and made public. It had once lived
   there, so the old URL already redirected. It needed to be public for the README link that
   `nextSteps` prints to work for anyone else, and for npm to attest provenance.
2. The package was created with `npm stage publish`, the staged version was rejected, and
   the trusted publisher was added, in the order the README then gave.
3. `main` was pushed. Both `verify` jobs passed and the publish job failed at
   `verifyConditions`: "OIDC token exchange with the npm registry failed: 404 OIDC token
   exchange error - package not found", then `ENONPMTOKEN`. It failed before tagging, so
   nothing was half-released. semantic-release opened an issue for the failure and closed it
   itself on the next success.
4. The cause was the reject. Rejecting the only staged version removes the package,
   placeholder included. npm's documentation says the `0.0.0-stage` placeholder is public
   while a version is staged and that reject "removes the selected staged versions"; it does
   not say the package goes too.
5. The package was staged again and left staged, the publisher added again, and the failed
   job re-run with no new push. semantic-release published 2.0.0 with a provenance
   statement, pushed `v2.0.0` and created the GitHub release. The registry listed 2.0.0
   about three minutes after the job finished.

The README's npm setup section now gives the order that worked: stage, add the publisher,
release, and only then reject the staged version.

Other things the rollout turned up:

- This checkout's `origin/HEAD` still pointed at a `master` branch that no longer exists,
  which made the desktop app's diff view compare against the wrong base.
  `git remote set-head origin --auto` fixed it.
- `npm stage` needs an npm newer than 11.11.0, and npm 12.2.3 needs Node `^22.22.2`,
  `^24.15.0` or `>=26`. On Node 24.14.1, `npx npm@latest stage publish` ran with an engine
  warning and failed only on an expired login.
- npm 12 warns `"bin[create]" script name dist/bin/create.js was invalid and removed` for a
  scoped package whose `bin` is a string. The message is wrong: `@npmcli/package-json`
  renames the entry to `create`, pushes that message because it compares against the key it
  has just deleted, and keeps the entry. The published 2.0.0 has
  `bin: { create: "dist/bin/create.js" }`.
- npm 12 prints `npm pack --json` as an object keyed by package name, not a list. The
  pre-push hook failed on the pack spec once npm 12 was first on the `PATH`; the push ran
  with the hook under Node 24 and npm 11, as CI does, and
  `test: read npm 12's pack report in the pack spec and test:skel` then made the spec and
  `packedPackage()` read either shape.
- npmjs.com marks "Allow npm publish" on a trusted publisher as not recommended. It is
  needed here, because semantic-release releases with `npm publish`.

Not confirmed when this was written: that rejecting the staged 1.0.0 after 2.0.0 exists
removes only the staged version, and that `npm init @limulus` runs against the published
package. The `0.0.0-stage` placeholder remains in the version list. The `GPR_READ_TOKEN`
repository secret is unused.

## Retrospective

The README's setup steps were written in `∆i4r` from npm's documentation without being
performed, and that entry said so. The one step the documentation was silent about, what a
reject does to a package with nothing else in it, is the one that failed, and it cost a
failed release run and a second pass through npm's setup. Instructions for a flow that
cannot be rehearsed should say which steps are unperformed where the reader will see it, not
only in the journal, and the first real run should be treated as the test of them.

semantic-release failing at `verifyConditions`, before it tags, is what made the failure
cheap. delto's 1.4.0 release failed after its tag was pushed and needed a point release to
recover.
