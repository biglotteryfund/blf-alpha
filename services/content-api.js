'use strict';

const { find, filter, get, getOr, map, sortBy, take } = require('lodash/fp');
const request = require('request-promise-native');

const mapAttrs = response => map('attributes')(response.data);

let { CONTENT_API_URL } = require('../modules/secrets');

if (!CONTENT_API_URL) {
    console.log('Error: CONTENT_API_URL endpoint must be defined');
    process.exit(1);
}

/**
 * Setter method exposed to aid with tests
 */
function setApiUrl(customApiUrl) {
    CONTENT_API_URL = customApiUrl;
}

/**
 * Getter method exposed to aid with tests
 */
function getApiUrl() {
    return CONTENT_API_URL;
}

function fetch(urlPath, options) {
    const defaults = {
        url: `${CONTENT_API_URL}${urlPath}`,
        json: true
    };
    const params = Object.assign({}, defaults, options);
    return request(params);
}

/**
 * Fetch all locales for a given url path
 * Usage:
 * ```
 * fetchAllLocales(reqLocale => {
 *   return `/v1/${reqLocale}/funding-programmes`
 * }).then(responses => ...)
 * ```
 */
function fetchAllLocales(toUrlPathFn) {
    const urlPaths = ['en', 'cy'].map(toUrlPathFn);
    const promises = urlPaths.map(urlPath => fetch(urlPath));
    return Promise.all(promises);
}

/**
 * Adds the preview parameters to the request
 * (if accessed via the preview domain)
 */
function addPreviewParams(previewMode, params) {
    if (!previewMode) {
        return params;
    }

    let previewParams = {};
    previewParams[previewMode.mode] = previewMode.id; // eg. ?draft=123

    return Object.assign({}, previewParams, params);
}

/**
 * Get CMS Path
 * Returns sanitised pagePath for top-level sections
 * otherwise prepends sectionId to pagePath
 */
function getCmsPath(sectionId, pagePath) {
    return sectionId === 'toplevel' ? pagePath.replace(/^\/+/g, '') : `${sectionId}${pagePath}`;
}

/**
 * Merge welsh by property name
 * Merge welsh results where available matched by a given property
 * Usage:
 * ```
 * mergeWelshBy('slug')(currentLocale, enResults, cyResults)
 * ```
 */
function mergeWelshBy(propName) {
    return function(currentLocale, enResults, cyResults) {
        if (currentLocale === 'en') {
            return enResults;
        } else {
            return map(enItem => {
                const findCy = find(cyItem => cyItem[propName] === enItem[propName]);
                return findCy(cyResults) || enItem;
            })(enResults);
        }
    };
}

function filterBySlugs(list, slugs) {
    const matches = filter(result => slugs.indexOf(result.slug) !== -1)(list);
    return sortBy(item => slugs.indexOf(item.slug))(matches);
}

/***********************************************
 * API Methods
 ***********************************************/

function getHeroImage({ locale, slug }) {
    return fetch(`/v1/${locale}/hero-image/${slug}`).then(response => response.data.attributes);
}

function getHomepage({ locale }) {
    return fetch(`/v1/${locale}/homepage`).then(response => response.data.attributes);
}

function getPromotedNews({ locale, limit }) {
    return fetch(`/v1/${locale}/promoted-news`).then(response => {
        const data = getOr({}, 'data')(response);
        const entries = data.map(entry => entry.attributes);
        return limit ? take(limit)(entries) : entries;
    });
}

function getBlogPosts({ locale }) {
    return fetchAllLocales(reqLocale => `/v1/${reqLocale}/blog`).then(responses => {
        const [enResults, cyResults] = responses.map(mapAttrs);
        const results = mergeWelshBy('slug')(locale, enResults, cyResults);
        return results;
    });
}

function getBlogDetail({ locale, urlPath }) {
    return fetch(`/v1/${locale}/blog${urlPath}`);
}

function getFundingProgrammes({ locale }) {
    return fetchAllLocales(reqLocale => `/v1/${reqLocale}/funding-programmes`).then(responses => {
        const [enResults, cyResults] = responses.map(mapAttrs);
        const results = mergeWelshBy('urlPath')(locale, enResults, cyResults);
        return results;
    });
}

function getFundingProgramme({ locale, slug, previewMode }) {
    return fetch(`/v1/${locale}/funding-programme/${slug}`, {
        qs: addPreviewParams(previewMode)
    }).then(response => {
        const entry = get('data.attributes')(response);
        return entry;
    });
}

function getListingPage({ locale, path, previewMode }) {
    return fetch(`/v1/${locale}/listing`, {
        qs: addPreviewParams(previewMode, { path })
    }).then(response => {
        const attributes = response.data.map(item => item.attributes);
        const match = attributes.find(_ => _.path === path);
        return match;
    });
}

function getCaseStudies({ locale, slugs = [] }) {
    return fetchAllLocales(reqLocale => `/v1/${reqLocale}/case-studies`).then(responses => {
        const [enResults, cyResults] = responses.map(mapAttrs);
        const results = mergeWelshBy('slug')(locale, enResults, cyResults);
        return slugs.length > 0 ? filterBySlugs(results, slugs) : results;
    });
}

function getProfiles({ locale, section }) {
    return fetchAllLocales(reqLocale => `/v1/${reqLocale}/profiles/${section}`).then(responses => {
        const [enResults, cyResults] = responses.map(mapAttrs);
        const results = mergeWelshBy('slug')(locale, enResults, cyResults);
        return results;
    });
}

function getSurveys({ locale = 'en', showAll = false }) {
    let params = {};
    if (showAll) {
        params.all = 'true';
    }

    return fetch(`/v1/${locale}/surveys`, { qs: params }).then(response => {
        return response.data.map(item => {
            let data = item.attributes;
            data.id = parseInt(item.id);
            return data;
        });
    });
}

function getRoutes() {
    return fetch('/v1/list-routes').then(mapAttrs);
}

module.exports = {
    setApiUrl,
    getApiUrl,
    getCmsPath,
    mapAttrs,
    mergeWelshBy,
    // API methods
    getBlogPosts,
    getBlogDetail,
    getCaseStudies,
    getFundingProgramme,
    getFundingProgrammes,
    getHeroImage,
    getHomepage,
    getListingPage,
    getProfiles,
    getPromotedNews,
    getRoutes,
    getSurveys
};
