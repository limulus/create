module.exports = {
  extends: ['@limulus'],
  ignorePatterns: ['dist/**/*'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.d.ts'],
      parserOptions: { project: ['./tsconfig.json', './skel/tsconfig.json'] },
    },
  ],
}
