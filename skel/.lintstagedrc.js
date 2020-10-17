module.exports = {
  '*.{js,ts,tsx}': (files) => [`eslint ${files.join(' ')}`, 'tsc --noEmit --project tsconfig.build.json'],
}
