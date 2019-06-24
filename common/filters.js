'use strict';
/**
 * Any functions added here will be added as
 * custom Nunjucks filters
 * @see https://mozilla.github.io/nunjucks/api.html#addfilter
 */
const fs = require('fs');
const path = require('path');
const slug = require('slugify');
const uuid = require('uuid/v4');
const { take, clone, pickBy, identity } = require('lodash');
const moment = require('moment');
const querystring = require('querystring');

const { stripTrailingSlashes } = require('./urls');

let assets = {};
try {
    assets = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../config/assets.json'), 'utf8')
    );
} catch (e) {} // eslint-disable-line no-empty

const version = assets.version || 'latest';

const getCachebustedPath = urlPath => `/assets/build/${version}/${urlPath}`;

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

function slugify(str) {
    return slug(str, { lower: true });
}

function isArray(xs) {
    return Array.isArray(xs);
}

function mailto(str) {
    return `<a href="mailto:${str}">${str}</a>`;
}

function numberWithCommas(str = '') {
    return str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function widont(str) {
    return str.replace(/\s([^\s<]+)\s*$/, '&nbsp;$1');
}

function timeago(date) {
    return moment(date).fromNow();
}

function stripEmptyValues(obj) {
    return pickBy(obj, identity);
}

function removeQueryParam(queryParams, param) {
    let queryObj = stripEmptyValues(clone(queryParams));
    delete queryObj[param];
    return querystring.stringify(queryObj);
}

function addQueryParam(queryParams, param, value) {
    let queryObj = stripEmptyValues(clone(queryParams));
    queryObj[param] = value;
    return querystring.stringify(queryObj);
}

module.exports = {
    appendUuid,
    filter,
    find,
    getCachebustedPath,
    isArray,
    mailto,
    numberWithCommas,
    pluralise,
    slugify,
    take,
    widont,
    timeago,
    removeQueryParam,
    addQueryParam,
    stripTrailingSlashes
};
