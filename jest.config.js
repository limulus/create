module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['node_modules', 'mocks'],
  coverageProvider: 'v8',
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  testPathIgnorePatterns: ['node_modules', 'dist'],
}
