'use strict';
const { has } = require('lodash');
const assets = require('./assets');

// rewrite text like '/welsh/' => '/welsh'
const stripTrailingSlashes = str => {
    let hasTrailingSlash = s => s[s.length - 1] === '/' && s.length > 1;

    if (hasTrailingSlash(str)) {
        // trim final character
        str = str.substring(0, str.length - 1);
    }

    return str;
};

// parse the string (eg. "£10,000" => 10000, "£1 million" => 1000000 etc)
const parseValueFromString = str => {
    const replacements = [['million', '000000'], [/,/g, ''], [/£/g, ''], [/ /g, '']];

    let upper = str.split(' - ')[1];
    if (upper) {
        replacements.forEach(r => {
            upper = upper.replace(r[0], r[1]);
        });
        upper = parseInt(upper);
    }
    return upper || str;
};

const createHeroImage = opts => {
    if (!['small', 'medium', 'large'].every(x => has(opts, x))) {
        throw new Error('Must pass a small, medium, and large image');
    }

    if (!has(opts, 'default')) {
        throw new Error('Must define a default image with opts.default');
    }

    return {
        small: assets.getImagePath(opts.small),
        medium: assets.getImagePath(opts.medium),
        large: assets.getImagePath(opts.large),
        default: assets.getImagePath(opts.default),
        caption: opts.caption || ''
    };
};

module.exports = {
    stripTrailingSlashes,
    parseValueFromString,
    createHeroImage
};
