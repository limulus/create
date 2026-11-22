import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['html', 'json', 'text', 'text-summary'],
      include: ['src/lib/**/*.ts', 'scripts/lib/**/*.ts'],
      exclude: ['**/node_modules/**', '**/mocks/**', '**/skel/**', '**/*.spec.ts'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    environment: 'node',
    // skel/ is template data, not source — its spec runs in generated projects, not here.
    exclude: ['**/node_modules/**', '**/dist/**', '**/skel/**'],
  },
})
