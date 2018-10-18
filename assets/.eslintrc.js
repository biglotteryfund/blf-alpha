'use strict';

module.exports = {
    extends: ['eslint:recommended', 'plugin:vue/recommended', 'plugin:compat/recommended'],
    settings: {
        polyfills: ['promises']
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
    }
};
