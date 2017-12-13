module.exports = {
    root: true,
    extends: 'eslint:recommended',
    env: {
        es6: true,
        node: true,
        browser: true
    },
    parser: 'babel-eslint',
    parserOptions: {
        sourceType: 'module',
        allowImportExportEverywhere: true
    },
    rules: {
        eqeqeq: 'error',
        semi: ['error', 'always'],
        'no-shadow': 'warn',
        'no-console': 'off',
        'no-unused-vars': 'warn'
    }
};
