// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*'] },
  // `tsc --noEmit` already checks every import. The import resolver cannot glob this repo's
  // path (it contains parentheses), so it reports false "unresolved" errors for `@/` aliases.
  { rules: { 'import/no-unresolved': 'off' } },
]);
