'use strict';

module.exports = {
    root: true,
    extends: 'eslint:recommended',
    plugins: ['no-only-tests'],
    env: {
        es6: true,
        node: true
    },
    parserOptions: {
        ecmaVersion: 2018
    },
    rules: {
        'eqeqeq': 'error',
        'no-console': 'warn',
        'no-only-tests/no-only-tests': 'error',
        // @TODO: Review if this should be re-enabled
        'require-atomic-updates': 'off',
        'semi': ['error', 'always'],
        'strict': ['warn', 'safe']
    }
};
