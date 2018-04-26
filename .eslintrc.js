'use strict';

module.exports = {
    root: true,
    extends: 'eslint:recommended',
    env: {
        es6: true,
        node: true
    },
    parserOptions: {
        ecmaVersion: 8
    },
    rules: {
        eqeqeq: 'error',
        semi: ['error', 'always'],
        'no-shadow': 'warn',
        'no-console': 'off',
        'no-unused-vars': 'warn'
    }
};
