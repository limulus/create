# Remove built-in `@limulus` and `@unallocate` assumptions

## Value

This is a step toward making the tool one that anyone can use, published as
`@limulus/create` (`∆vIB`). Someone other than Eric can then create a package under their
own name, scope and GitHub account.

## Background

Eric asked on 2026-11-22 to re-assess how `@limulus` and `@unallocate` are integrated into
this project.

Found in the code that day, as places where a value is built in rather than taken from the
package being created:

- `skel/package.json.mustache` writes the `repository`, `bugs` and `homepage` URLs under
  `github.com/limulus/`, whatever the package's scope is.
- `skel/.npmrc.mustache` maps the `@unallocate` scope to GitHub Packages, whatever the
  package's scope is.
- `skel/package.json.mustache` and `skel/LICENSE.mustache` name Eric McCarthy as the author
  and copyright holder.

Also found that day: `GitRepository` in `src/lib/GitRepository.ts` already has
`githubOwner()` and `githubRepoName()`, which nothing calls. Both throw when there is no
`origin` remote and when its URL is not `https://github.com/<owner>/<repo>.git`, so an SSH
remote, or an HTTPS one without `.git`, is refused.

## Scope and constraints

Eric's decisions, 2026-11-22:

- Any package name can be created.
- The user always gives the full name, including the scope when the package has one.
- A scoped package is private by default. `--public` makes it public.
- An unscoped package stays always public, as it is today.
- A public package publishes to npm through trusted publishing. That work is `∆i4r`.
- A private package publishes to GitHub Packages.
- The GitHub owner in the generated URLs comes from the repository, when it is available
  there.
- When the owner cannot be read from the repository, `create` stops with an error, and a
  flag lets the user supply the owner by hand.
- The author and copyright holder become an argument. Eric's word was "probably".
- When the author argument is not given, the author comes from git config.
- `@limulus/eslint-config` stays as the generated project's lint and Prettier configuration.

## Implementation suggestions

- Git config has `user.name` and `user.email` but nothing for the author's URL, which the
  generated `package.json` carries today. Leave the URL out unless the argument supplies it.
