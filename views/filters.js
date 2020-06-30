'use strict';
/**
 * Any functions added here will be added as
 * custom Nunjucks filters
 * @see https://mozilla.github.io/nunjucks/api.html#addfilter
 */
const slug = require('slugify');
const { v4: uuidv4 } = require('uuid');
const clone = require('lodash/clone');
const identity = require('lodash/identity');
const pickBy = require('lodash/pickBy');
const take = require('lodash/take');
const querystring = require('querystring');

module.exports = {
    take: take,

    filter(list = [], key, value) {
        return list.filter((item) => item[key] === value);
    },

    find(list = [], key, value) {
        return list.find((item) => item[key] === value);
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
        return str + uuidv4();
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
