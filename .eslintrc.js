module.exports = {
  extends: ['@limulus'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.d.ts'],
      parserOptions: { project: ['./tsconfig.json', './skel/tsconfig.json'] },
    },
  ],
}
