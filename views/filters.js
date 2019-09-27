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
const querystring = require('querystring');

const { stripTrailingSlashes } = require('../common/urls');

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

function removeQueryParam(queryParams, param) {
    let queryObj = pickBy(clone(queryParams), identity);
    delete queryObj[param];
    return querystring.stringify(queryObj);
}

function addQueryParam(queryParams, param, value) {
    let queryObj = pickBy(clone(queryParams), identity);
    queryObj[param] = value;
    return querystring.stringify(queryObj);
}

function removeQuery(str) {
    return str.split('?')[0];
}

module.exports = {
    appendUuid,
    filter,
    find,
    getCachebustedPath,
    isArray,
    mailto,
    numberWithCommas,
    slugify,
    take,
    widont,
    removeQueryParam,
    addQueryParam,
    stripTrailingSlashes,
    removeQuery
};
