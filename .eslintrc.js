module.exports = {
  extends: '@limulus',
  ignorePatterns: '!.*.js',
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  ],
}
