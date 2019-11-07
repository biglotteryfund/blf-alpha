'use strict';

module.exports = {
    root: true,
    extends: ['eslint:recommended', 'plugin:node/recommended'],
    plugins: ['no-only-tests'],
    env: {
        es6: true,
        node: true
    },
    parserOptions: {
        ecmaVersion: 2020
    },
    rules: {
        'eqeqeq': 'error',
        'no-console': 'warn',
        'require-atomic-updates': 'off',
        'semi': ['error', 'always'],
        'strict': ['warn', 'safe'],

        // Plugins
        'no-only-tests/no-only-tests': 'error',
        'node/no-unpublished-require': 'off',
        'node/shebang': 'off'
    }
};
