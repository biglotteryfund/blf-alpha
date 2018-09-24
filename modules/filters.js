'use strict';
/**
 * Any functions added here will be added as
 * custom Nunjucks filters
 * @see https://mozilla.github.io/nunjucks/api.html#addfilter
 */
const config = require('config');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const slug = require('slugify');
const uuid = require('uuid/v4');

let assets = {};
try {
    assets = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/assets.json'), 'utf8'));
} catch (e) {} // eslint-disable-line no-empty

function getCachebustedPath(urlPath, useRemoteAssets = config.get('features.useRemoteAssets')) {
    const version = assets.version || 'latest';
    const baseUrl = useRemoteAssets ? 'https://media.biglotteryfund.org.uk/assets' : `/assets`;
    return `${baseUrl}/build/${version}/${urlPath}`;
}

function appendUuid(str) {
    return str + uuid();
}

function getImagePath(urlPath) {
    if (/^http(s?):\/\//.test(urlPath)) {
        return urlPath;
    } else {
        return `/assets/images/${urlPath}`;
    }
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

function numberWithCommas(str = '') {
    return str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function pluralise(number, singular, plural) {
    if (number === 1) {
        return singular;
    } else {
        return plural;
    }
}

// @TODO: Specific to materials code?
// allow filtering of a list as nunjucks' selectattr
// only supports boolean (eg. valueless) filtering
/* istanbul ignore next */
function filter(arr, key, value) {
    return arr.filter(a => a[key] === value);
}

// @TODO: Specific to materials code?
/* istanbul ignore next */
function find(arr, key, value) {
    return arr.find(a => a[key] === value);
}

function removeQueryParam(queryParams, paramToRemove) {
    let newParams = Object.assign({}, queryParams);
    delete newParams[paramToRemove];
    return querystring.stringify(newParams);
}

/**
 * addQueryParam
 * @param {string} queryParams - The existing querystring object
 * @param {array} newParams - An array of arrays of key/value pairs
 * (eg. [['foo', 'bar'], ['baz', 'quux']]
 */
function addQueryParam(queryParams, newParams) {
    let clone = Object.assign({}, queryParams);
    newParams.forEach(pair => {
        let [key, value] = pair;
        clone[key] = value;
    });
    return querystring.stringify(clone);
}

module.exports = {
    appendUuid,
    filter,
    find,
    getCachebustedPath,
    getImagePath,
    isArray,
    mailto,
    makePhoneLink,
    numberWithCommas,
    pluralise,
    slugify,
    removeQueryParam,
    addQueryParam
};
