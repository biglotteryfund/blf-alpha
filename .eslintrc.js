'use strict';

module.exports = {
    root: true,
    extends: ['eslint:recommended', 'plugin:node/recommended'],
    plugins: ['lodash', 'no-only-tests'],
    env: {
        es6: true,
        node: true,
    },
    parserOptions: {
        ecmaVersion: 2020,
    },
    rules: {
        'eqeqeq': 'error',
        'no-console': 'warn',
        'require-atomic-updates': 'off',
        'semi': ['error', 'always'],
        'strict': ['warn', 'safe'],
        'no-warning-comments': [
            'warn',
            { location: 'anywhere', terms: ['todo'] },
        ],

        // Plugins
        'no-only-tests/no-only-tests': 'error',
        'node/no-unpublished-require': 'off',
        'node/shebang': 'off',
        'lodash/import-scope': ['warn', 'method'],

        // Stuff that's suddenly failing in new version
        'vue/no-mutating-props': 'off'
    },
};
