'use strict';

module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:vue/strongly-recommended',
        'plugin:compat/recommended'
    ],
    settings: {
        polyfills: ['Promise']
    },
    env: {
        node: false,
        commonjs: true,
        browser: true,
        es6: true
    },
    parserOptions: {
        parser: 'babel-eslint',
        sourceType: 'module',
        allowImportExportEverywhere: true
    },
    rules: {
        'vue/html-closing-bracket-newline': 'off',
        'vue/html-indent': 'off',
        'vue/html-self-closing': 'off',
        'vue/max-attributes-per-line': 'off',
        'vue/require-prop-types': 'off',
        'vue/singleline-html-element-content-newline': 'off'
    }
};
