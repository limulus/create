module.exports = {
  '*.{js,ts,tsx}': (files) => [`eslint ${files.join(' ')}`, 'tsc --noEmit'],
}
