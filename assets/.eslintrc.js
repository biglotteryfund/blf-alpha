'use strict';

module.exports = {
    extends: ['eslint:recommended', 'plugin:vue/recommended'],
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
