module.exports = {
  hooks: {
    'commit-msg': 'npx commitlint -E HUSKY_GIT_PARAMS',
    'pre-commit': 'npm run verify',
    'pre-push': 'npm test',
  },
}
