'use strict';
const assert = require('assert');
const pkg = require('./package.json');

assert(pkg.browserslist.length > 0);

module.exports = {
    plugins: ['@babel/plugin-syntax-dynamic-import', 'lodash'],
    presets: [
        [
            '@babel/preset-env',
            {
                modules: false,
                targets: {
                    browsers: pkg.browserslist
                }
            }
        ]
    ],
    env: {
        test: {
            presets: [['@babel/preset-env']]
        }
    }
};
