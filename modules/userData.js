'use strict';

/**
 * Extract post code area (outcode)
 * Based on https://github.com/ideal-postcodes/postcode.js
 */
function postcodeArea(postcode) {
    const incodeRegex = /\d[a-z]{2}$/i;
    return postcode
        .replace(incodeRegex, '')
        .replace(/\s+/, '')
        .toUpperCase();
}

module.exports = {
    postcodeArea
};
