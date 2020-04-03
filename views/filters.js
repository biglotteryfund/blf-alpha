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
const clone = require('lodash/clone');
const identity = require('lodash/identity');
const pickBy = require('lodash/pickBy');
const take = require('lodash/take');
const querystring = require('querystring');

let assets = {};
try {
    assets = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../config/assets.json'), 'utf8')
    );
} catch (e) {} // eslint-disable-line no-empty

const version = assets.version || 'latest';

module.exports = {
    take: take,

    filter(list = [], key, value) {
        return list.filter((item) => item[key] === value);
    },

    find(list = [], key, value) {
        return list.find((item) => item[key] === value);
    },

    getCachebustedPath(urlPath) {
        return `/assets/build/${version}/${urlPath}`;
    },

    numberWithCommas(str = '') {
        return str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    slugify: function (str) {
        return slug(str, { lower: true });
    },

    widont(str) {
        return str ? str.replace(/\s([^\s<]+)\s*$/, '&nbsp;$1') : null;
    },

    appendUuid(str) {
        return str + uuid();
    },

    addQueryParam(queryParams, param, value) {
        let queryObj = pickBy(clone(queryParams), identity);
        queryObj[param] = value;
        return querystring.stringify(queryObj);
    },

    removeQueryParam(queryParams, param) {
        let queryObj = pickBy(clone(queryParams), identity);
        delete queryObj[param];
        return querystring.stringify(queryObj);
    },
};
