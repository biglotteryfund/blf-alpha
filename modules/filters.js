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

/**
 * Filter
 * Allow filtering of a list as nunjucks' selectattr
 * only supports boolean (eg. valueless) filtering
 * @param {array} list
 * @param {string} key
 * @param {string} value
 */
function filter(list = [], key, value) {
    return list.filter(item => item[key] === value);
}

/**
 * Find
 * @param {array} list
 * @param {string} key
 * @param {string} value
 */
function find(list = [], key, value) {
    return list.find(item => item[key] === value);
}

/**
 * Pluralisation helper
 * @param {number} number
 * @param {string} singular
 * @param {string} plural
 */
function pluralise(number, singular, plural) {
    return number === 1 ? singular : plural;
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

function removeQueryParam(queryParams, paramToRemove) {
    let newParams = Object.assign({}, queryParams);
    delete newParams[paramToRemove];
    return querystring.stringify(newParams);
}

function addQueryParam(queryParams, paramToAdd, paramValue) {
    let newParams = Object.assign({}, queryParams);
    newParams[paramToAdd] = paramValue;
    return querystring.stringify(newParams);
}

module.exports = {
    addQueryParam,
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
    removeQueryParam,
    slugify
};
