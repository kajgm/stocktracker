/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting',
    'prettier'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    parser: '@typescript-eslint/parser'
  },
  rules: {
    '@typescript-eslint/consistent-type-imports': 2,
    '@typescript-eslint/prefer-for-of': 2,
    '@typescript-eslint/unbound-method': 0,
    '@typescript-eslint/no-unused-vars': 0,
    '@typescript-eslint/no-unsafe-assignment': 0,
    'vue/multi-word-component-names': 0,
    'vue/require-typed-ref': 2,
    'vue/component-api-style': [2, ['script-setup']],
    'vue/block-lang': [2, { script: { lang: 'ts' } }],
    'vue/define-macros-order': 2,
    'vue/define-props-declaration': 2,
    'vue/no-ref-object-reactivity-loss': 2,
    'vue/no-undef-properties': 2,
    'vue/no-unused-components': [2, { ignoreWhenBindingPresent: true }],
    'vue/no-unused-properties': 2,
    'vue/no-unused-refs': 2,
    'prettier/prettier': 2
  },
  ignorePatterns: ['/*', '!/src', '!/tests']
};
