import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/mocks/**', '**/skel/**'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
      include: ['src/lib/**/*.ts'],
    },
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
