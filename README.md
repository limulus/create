# create

Create a TypeScript npm package or project

## Usage

From within a fresh and empty git repository:

```sh
git checkout -b v1-workspace
npm init @unallocate @scope/pkgname 'A short description'
npm install
```

You can also specify a target platform using the `--target` option:

```sh
npm init @unallocate @scope/pkgname 'A short description' --target web
```

Available targets:
- `node` (default): Uses NodeNext module resolution for Node.js projects 
- `web`: Uses ESNext modules with bundler resolution for web/browser projects

When you are ready to do an initial release, merge `v1-workspace` into `main`.
