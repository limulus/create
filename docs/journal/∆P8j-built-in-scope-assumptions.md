---
id: ∆P8j
completed: 2026-11-22 12:32:19 -07:00
---

## Backlog item

> - `∆P8j` Remove built-in `@limulus` and `@unallocate` assumptions
>   - Accept any full package name, read the GitHub owner from the repository, and take the
>     author as an argument. Today all three are fixed to Eric's own.

## Planning

### Why

A step toward making this a tool anyone can use, published as `@limulus/create` (`∆vIB`):
someone other than Eric should be able to create a package under their own name, scope and
GitHub account.

### Background

Eric asked on 2026-11-22 to re-assess how `@limulus` and `@unallocate` were integrated into
the project. Values built in rather than taken from the package being created:

- `skel/package.json.mustache` wrote the `repository`, `bugs` and `homepage` URLs under
  `github.com/limulus/`, whatever the package's scope.
- `skel/.npmrc.mustache` mapped the `@unallocate` scope to GitHub Packages, whatever the
  package's scope. (Left alone here: `∆D1e` deletes that file.)
- `skel/package.json.mustache` and `skel/LICENSE.mustache` named Eric McCarthy as author and
  copyright holder.
- `GitRepository` already had `githubOwner()` and `githubRepoName()`, which nothing called,
  and which refused any `origin` other than `https://github.com/<owner>/<repo>.git`.

### Eric's decisions (2026-11-22)

- Any package name can be created; the user always gives the full name, scope included.
- A scoped package is private by default and `--public` makes it public; an unscoped package
  is always public. Public packages publish to npm through trusted publishing (`∆i4r`),
  private ones to GitHub Packages.
- The GitHub owner in the generated URLs comes from the repository when it is available
  there. When it cannot be read, `create` stops with an error, and a flag lets the user
  supply the owner by hand.
- The author and copyright holder become an argument ("probably"), defaulting to git config
  when the argument is not given.
- `@limulus/eslint-config` stays as the generated project's lint and Prettier configuration.

### Choices made during implementation

- **`--owner <owner>`** is the flag. When given, `origin` is not consulted at all and the
  repository name falls back to the unscoped package name, as before. Without it, both the
  owner _and_ the repository name come from `origin`, since a URL that mixed the real owner
  with a guessed repository name would point nowhere when the two names differ.
- **`origin` parsing uses `hosted-git-info`** (npm's own) instead of the old regex, so SSH,
  `ssh://` and HTTPS without `.git` remotes are accepted. Non-GitHub hosts are refused, and
  so is hosted-git-info's shorthand (`owner/repo`, `github:owner/repo`): as an `origin`, a
  bare `owner/repo` is a relative local path.
- **`--author <author>`** takes npm's person string, `Name <email> (url)`, parsed with
  `parse-author`. This lets the URL that `package.json` used to carry be supplied when
  wanted, and is left out otherwise, as the brief suggested. Given `--author`, git config is
  not consulted, not even to fill in a missing email. Without it, `user.name` (required) and
  `user.email` (optional) come from git config.
- **Name validation uses `validate-npm-package-name`**'s `validForNewPackages`, replacing an
  unanchored regex that rejected valid names (`@scope/foo.js`, `x_y`) while accepting
  invalid ones (`foo bar`). The error lists npm's reasons.
- **Typed error for missing git info.** `GitRepository` throws `MissingGitInfoError` for a
  missing or non-GitHub `origin` and for an unset `user.name`; the CLI catches only that
  type and appends which option supplies the value. Other git failures (for example "must be
  a git repository") pass through unchanged.
- **`GitRepository` is injected into the CLI** through `inject()`, with a hand-written
  `src/mocks/GitRepositoryMock.ts`, like the other collaborators.
- **The author is rendered as JSON** (`Package.authorJson`) rather than through mustache
  fields, so quotes in a name cannot break `package.json` and absent fields drop out.
- **Dependency majors** are `hosted-git-info@9` and `validate-npm-package-name@7`: their
  latest majors require Node `^24.15`, narrower than this package's `>=24`.
- `Package` validates the GitHub owner and repository name against GitHub's character rules
  and requires a non-empty author name, so a bad `--owner` or a name-less `--author` fails
  before anything is written. The owner check allows consecutive and trailing hyphens:
  GitHub refuses them for new accounts, but some older accounts have them, and refusing a
  real `origin` owner would leave no workaround, since `--owner` goes through the same
  check.
- The AGENTS.md "Common Tasks" recipe gained a `git remote add origin` line, since the
  scratch repository it builds would otherwise be refused.

### Breaking change

The implementation commit carries a `BREAKING CHANGE:` footer: a run in a repository with no
GitHub `origin` and no `--owner`, or with no git `user.name` and no `--author`, now fails
where it used to succeed. When pushed, that releases a new major version.

## Refinement

- simple-git strips ambient `GIT_*` environment variables (its environment guard) before
  spawning git, so `GIT_CONFIG_GLOBAL=/dev/null` could not isolate the `author()` specs from
  the machine's own `~/.gitconfig`. The specs move `HOME` and `XDG_CONFIG_HOME` to an empty
  temporary directory instead. A `user.name` in the system git config would still leak in.
- Verified end to end from `dist/bin/create.js`: generated a private scoped node package
  (SSH `origin`, author from git config), a public scoped web package (HTTPS `origin`,
  `--author` with a quoted name, email and URL) and an unscoped node package with a dot in
  its name (`--owner`, no `origin`); checked each `package.json` and `LICENSE`, then ran
  `npm install && npm run verify && npm run build` in each, all green. Also saw the error
  output for no `origin`, a GitLab `origin`, an invalid name, a name-less `--author` and a
  directory that is not a git repository.
- Negative-tested the GitHub host check and the author-name check by breaking each once,
  watching their specs fail, and reversing the edits.
- Left for other items: the README's `npm init @unallocate` lines (`∆vIB`), its
  `v1-workspace` step (`∆oSa`), `skel/.npmrc.mustache` and `GPR_READ_TOKEN` (`∆D1e`) and the
  publish job's token (`∆i4r`).
- Not done: GitHub Packages only accepts a package whose scope matches the repository's
  owner, but `create` does not check that a private package's scope matches the owner it
  read. Errors also come in lookup order, so an invalid package name is reported only after
  the `origin` and author lookups succeed.

## Retrospective

The brief's background (that `githubOwner()` refused SSH remotes) pointed straight at the
right fix. The one surprise was simple-git's environment guard: test isolation through
`GIT_*` variables silently does nothing with simple-git, so check that an isolation actually
takes effect (here, by seeing the test fail on the developer's own config) before relying on
it.
