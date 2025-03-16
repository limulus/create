# Create Project Helper Guide

## Commands

- Build: `npm run build`
- Clean: `npm run clean`
- Lint: `npm run lint`
- Type check: `npm run tscc`
- Test (all): `npm run test`
- Test (single file): `npm test -- src/path/to/file.spec.ts`
- Verify (lint+test+typecheck): `npm run verify`

## Code Style Guidelines

- **ESM**: Use ES Modules (`import/export` not `require()`)
- **File Extensions**: Always include `.js` in imports (e.g., `import x from './x.js'`)
- **Typing**: Use strict TypeScript typing, prefer interfaces for object types
- **Naming**:
  - Classes: PascalCase
  - Methods/variables: camelCase
  - Files: PascalCase for classes, camelCase for modules
- **Testing**: 100% coverage required (functions, branches, lines, statements)
- **Error Handling**: Use typed errors and proper propagation
- **Project Structure**:
  - `src/lib/` - Core functionality
  - `src/bin/` - CLI entry points
  - `src/mocks/` - Test mocks
  - `skel/` - Templates used to create new packages
