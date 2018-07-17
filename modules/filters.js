'use strict';
/**
 * Any functions added here will be added as
 * custom Nunjucks filters
 * @see https://mozilla.github.io/nunjucks/api.html#addfilter
 */
const slug = require('slugify');

const assets = require('./assets');

function getCachebustedPath(str) {
    return assets.getCachebustedPath(str);
}

function getCachebustedRealPath(str) {
    return assets.getCachebustedRealPath(str);
}

function getImagePath(str) {
    return assets.getImagePath(str);
}

function slugify(str) {
    return slug(str, { lower: true });
}

function isArray(xs) {
    return Array.isArray(xs);
}

function makePhoneLink(str) {
    let callable = str.replace(/ /g, '');
    return `<a href="tel:${callable}" class="is-phone-link">${str}</a>`;
}

function mailto(str) {
    return `<a href="mailto:${str}">${str}</a>`;
}

function numberWithCommas(str) {
    return str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function pluralise(number, singular, plural) {
    if (number === 1) {
        return singular;
    } else {
        return plural;
    }
}

// allow filtering of a list as nunjucks' selectattr
// only supports boolean (eg. valueless) filtering
function filter(arr, key, value) {
    return arr.filter(a => a[key] === value);
}

function find(arr, key, value) {
    return arr.find(a => a[key] === value);
}

module.exports = {
    filter,
    find,
    getCachebustedPath,
    getCachebustedRealPath,
    getImagePath,
    isArray,
    mailto,
    makePhoneLink,
    numberWithCommas,
    pluralise,
    slugify
};
