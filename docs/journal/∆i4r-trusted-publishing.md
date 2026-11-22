---
id: ∆i4r
completed: 2026-11-22 12:42:19 -07:00
---

## Backlog item

> - `∆i4r` Trusted publishing for public packages
>   - Publish to npm through OIDC with provenance, as lemmon does, in place of a long-lived
>     `NPM_TOKEN` secret, and document the one-time npm setup a new package needs.

## Planning

This section folds in the item's brief, written on 2026-11-22. The generated publish job
authenticated with a secret, `NPM_TOKEN` for a public package and `GITHUB_TOKEN` for a
private one, chosen by `Package.publishTokenSecretName`, and had no `permissions` block.
semantic-release 25 bundles `@semantic-release/npm` 13, which tries an OIDC token exchange
before falling back to `NPM_TOKEN` and needs `id-token: write` on the job. lemmon's release
job already publishes this way, with no npm token. Its `∆PiI` entry records the npm side: a
trusted publisher can be added only to a package that exists, so each package was first
created with `npm stage publish`, and a publisher created after 2026-09-03 only stages
releases unless it is allowed to publish directly.

Eric's decisions, 2026-11-22:

- A public package publishes to npm through trusted publishing, as decided with `∆P8j`.
- The work documents the one-time npm setup a new public package needs before its first
  release: creating the package, and configuring its trusted publisher to publish directly.
- Only generated projects change. `create`'s own release workflow moves in `∆vIB`.

Choices made while building, not settled by the brief:

- **Permissions.** The public publish job gets `contents`, `issues`, `pull-requests` and
  `id-token` write, the set `@semantic-release/npm`'s README gives for using
  semantic-release "to its fullest", rather than lemmon's two. lemmon turns off the GitHub
  plugin's success and fail comments and its released labels; a generated project runs the
  plugin's defaults, and `@semantic-release/github` 12 throws from its success step when a
  comment fails, which would turn a released build red.
- **Private packages are untouched.** Their job keeps no `permissions` block and still
  passes `GITHUB_TOKEN` as `NPM_TOKEN`. Giving it an explicit block would need
  `packages: write` and is outside this item.
- **`publishTokenSecretName` is gone.** Only one value was left, so the template names
  `GITHUB_TOKEN` inside a private-only section. `Package` is not exported from the package's
  entry point, so nothing outside `create` loses it.
- **The setup is documented in `create`'s README**, under "Setting up npm for a public
  package", where a user reads before generating, and a comment on the generated publish job
  names `cd.yaml` as the file the trusted publisher must name. The generated README is the
  package's own page for its users, so it stays out of it.
- **No `provenance` setting.** npm attests provenance by itself under trusted publishing,
  and only from a public repository; forcing it would fail a public package published from a
  private repository.

## Refinement

Built as one commit, `feat: publish public packages through npm trusted publishing`.

Reading `@semantic-release/npm` 13.2.0's source turned up a defect the brief did not
anticipate: `oidcContextEstablished` compares the registry to `https://registry.npmjs.org/`
with `===`, and the registry comes straight from `publishConfig.registry`. Generated
projects wrote it without the trailing slash, so the plugin would have skipped the OIDC
exchange and failed every release with `ENONPMTOKEN`. `Package.publishRegistry` now returns
the URL with its slash, with a comment saying why.

Verification:

- `npm run verify` (102 tests, 100% coverage) and `npm run build` in the worktree.
- Generated four projects from the built CLI: private scoped node, public scoped node,
  public scoped web, unscoped web. `npm install && npm run verify && npm run build` passed
  in each. Parsing each `cd.yaml` with `js-yaml` showed the private job with no permissions
  and `NPM_TOKEN: ${{ secrets.GITHUB_TOKEN }}`, and each public job with the four
  permissions and `GITHUB_TOKEN` alone.
- `npx semantic-release@25 --dry-run` in the public node project, with GitHub Actions'
  environment variables faked, a local bare repository as the repository URL and no
  `NPM_TOKEN`, logged "Verifying OIDC context for publishing from GitHub Actions" before
  falling back. With the trailing slash removed from `package.json` by hand, it skipped
  straight to "Verify authentication for registry https://registry.npmjs.org", confirming
  the defect; the slash was then put back.

Not exercised: a real trusted publish. No dry run can obtain a GitHub OIDC token or reach
the exchange on npm's side, so the job's permissions were checked by reading them against
lemmon's working release job and `@semantic-release/npm`'s documented requirements. The
README's npm steps follow lemmon's `∆PiI` and npm's trusted-publisher documentation as read
on 2026-11-22, including its two-day expiry for a publisher that has not published; none of
them was performed. The npm bundled with this machine's Node, 11.11.0, has no `stage`
command, which is why the README suggests `npx npm@latest stage publish`. After review, both
unexercised claims were re-checked: npm's trusted-publishers page still says a new
configuration must complete its first publish within 2 days or it expires, and that
machine's Node is 24.14.1, so at least one Node 24 release bundles an npm without `stage`.

`README.md` still has two formatting differences from Prettier that predate this item, a
trailing space and a missing final newline; they were left alone so as not to collide with
other items editing the same lines. The publish job's `npm ci` still passes
`GPR_READ_TOKEN`, which `∆D1e` removes.

## Retrospective

The brief's research stopped at the documented requirement, `id-token: write`, and would
have shipped a job that never attempted OIDC. Read the code path that decides whether a
feature engages, not only the docs for enabling it, when a real run is out of reach.
