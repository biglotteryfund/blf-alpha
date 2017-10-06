'use strict';

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

module.exports = {
    stripTrailingSlashes,
    parseValueFromString
};
