module.exports = {
    root: true,
    extends: 'eslint:recommended',
    env: {
        es6: true,
        node: true,
        browser: true
    },
    rules: {
        eqeqeq: 2,
        semi: [2, 'always'],

        'no-console': 0,
        'no-unused-vars': 1
    }
};
