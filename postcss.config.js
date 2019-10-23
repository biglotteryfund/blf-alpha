'use strict';
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const foftLoadedClasses = require('postcss-foft-classes');

module.exports = {
    plugins: [
        autoprefixer(),
        foftLoadedClasses({
            groups: [
                {
                    families: ['caecilia'],
                    classNames: ['fonts-loaded']
                },
                {
                    families: ['caecilia-sans-text'],
                    classNames: ['fonts-loaded']
                }
            ]
        }),
        cssnano()
    ]
};
