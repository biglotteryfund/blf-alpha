'use strict';
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const foutWithAClass = require('postcss-fout-with-a-class').default;

module.exports = {
    plugins: [
        autoprefixer(),
        foutWithAClass({
            families: ['caecilia', 'caecilia-sans-text'],
            className: 'fonts-loaded'
        }),
        cssnano()
    ]
};
