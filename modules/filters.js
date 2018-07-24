'use strict';
/**
 * Any functions added here will be added as
 * custom Nunjucks filters
 * @see https://mozilla.github.io/nunjucks/api.html#addfilter
 */
const slug = require('slugify');
const querystring = require('querystring');
const { includes } = require('lodash');

const assets = require('./assets');

module.exports = {
    getCachebustedPath(str) {
        return assets.getCachebustedPath(str);
    },
    getCachebustedRealPath(str) {
        return assets.getCachebustedRealPath(str);
    },
    getImagePath(str) {
        return assets.getImagePath(str);
    },
    slugify(str) {
        return slug(str, { lower: true });
    },
    joinIfArray(xs, delimiter) {
        if (Array.isArray(xs)) {
            return xs.join(delimiter);
        } else {
            return xs;
        }
    },
    makePhoneLink(str) {
        let callable = str.replace(/ /g, '');
        return `<a href="tel:${callable}" class="is-phone-link">${str}</a>`;
    },
    mailto(str) {
        return `<a href="mailto:${str}">${str}</a>`;
    },
    numberWithCommas(str) {
        return str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    pluralise(number, singular, plural) {
        if (number === 1) {
            return singular;
        } else {
            return plural;
        }
    },
    filter(arr, key, value) {
        // allow filtering of a list as nunjucks' selectattr
        // only supports boolean (eg. valueless) filtering
        return arr.filter(a => a[key] === value);
    },
    find(arr, key, value) {
        return arr.find(a => a[key] === value);
    },
    includes(arr, value) {
        return includes(arr, value);
    },
    removeQueryParam(queryParams, paramToRemove) {
        let newParams = Object.assign({}, queryParams);
        delete newParams[paramToRemove];
        return querystring.stringify(newParams);
    }
};
