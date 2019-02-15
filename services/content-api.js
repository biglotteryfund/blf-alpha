'use strict';
const { find, filter, get, head, map, sortBy } = require('lodash/fp');
const request = require('request-promise-native');
const debug = require('debug')('tnlcommunityfund:content-api');
const querystring = require('querystring');

const getAttrs = response => get('data.attributes')(response);
const mapAttrs = response => map('attributes')(response.data);

const { sanitiseUrlPath } = require('../modules/urls');
let { CONTENT_API_URL } = require('../modules/secrets');

function fetch(urlPath, options) {
    debug(`Fetching ${urlPath}${options && options.qs ? '?' + querystring.stringify(options.qs) : ''}`);
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
function fetchAllLocales(toUrlPathFn, options = {}) {
    const urlPaths = ['en', 'cy'].map(toUrlPathFn);
    const promises = urlPaths.map(urlPath => fetch(urlPath, options));
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

function getRoutes() {
    return fetch('/v1/list-routes').then(mapAttrs);
}

function getAliases({ locale }) {
    return fetch(`/v1/${locale}/aliases`).then(mapAttrs);
}

function getHeroImage({ locale, slug }) {
    return fetch(`/v1/${locale}/hero-image/${slug}`).then(response => response.data.attributes);
}

function getHomepage({ locale }) {
    return fetch(`/v1/${locale}/homepage`).then(response => response.data.attributes);
}

/**
 * Get updates
 * @param options
 * @property {string} options.locale
 * @property {string} [options.type]
 * @property {string} [options.date]
 * @property {string} [options.slug]
 * @property {object} [options.query]
 * @property {object} [options.previewMode]
 */
function getUpdates({ locale, type = null, date = null, slug = null, query = {}, previewMode = null }) {
    if (slug) {
        return fetch(`/v1/${locale}/updates/${type}/${date}/${slug}`, {
            qs: addPreviewParams(previewMode)
        }).then(response => {
            return {
                meta: response.meta,
                result: response.data.attributes
            };
        });
    } else {
        return fetch(`/v1/${locale}/updates/${type || ''}`, {
            qs: addPreviewParams(previewMode, { ...query, ...{ 'page-limit': 10 } })
        }).then(response => {
            return {
                meta: response.meta,
                result: mapAttrs(response)
            };
        });
    }
}

function getFundingProgrammes({ locale, page = 1, pageLimit = 100, showAll = false }) {
    return fetchAllLocales(reqLocale => `/v2/${reqLocale}/funding-programmes`, {
        qs: { page: page, 'page-limit': pageLimit, all: showAll === true }
    }).then(responses => {
        const [enResults, cyResults] = responses.map(mapAttrs);
        return {
            meta: head(responses).meta,
            result: mergeWelshBy('slug')(locale, enResults, cyResults)
        };
    });
}

function getFundingProgramme({ locale, slug, previewMode = false }) {
    return fetch(`/v2/${locale}/funding-programmes/${slug}`, {
        qs: addPreviewParams(previewMode)
    }).then(response => get('data.attributes')(response));
}

function getResearch({ locale, slug = null, previewMode = null }) {
    if (slug) {
        return fetch(`/v1/${locale}/research/${slug}`, {
            qs: addPreviewParams(previewMode)
        }).then(getAttrs);
    } else {
        return fetch(`/v1/${locale}/research`, {
            qs: addPreviewParams(previewMode)
        }).then(mapAttrs);
    }
}

function getStrategicProgrammes({ locale, slug = null, previewMode = null }) {
    if (slug) {
        return fetch(`/v1/${locale}/strategic-programmes/${slug}`, {
            qs: addPreviewParams(previewMode)
        }).then(response => get('data.attributes')(response));
    } else {
        return fetchAllLocales(reqLocale => `/v1/${reqLocale}/strategic-programmes`).then(responses => {
            const [enResults, cyResults] = responses.map(mapAttrs);
            return mergeWelshBy('urlPath')(locale, enResults, cyResults);
        });
    }
}

function getListingPage({ locale, path, previewMode }) {
    const sanitisedPath = sanitiseUrlPath(path);
    return fetch(`/v1/${locale}/listing`, {
        qs: addPreviewParams(previewMode, { path: sanitisedPath })
    }).then(response => {
        const attributes = response.data.map(item => item.attributes);
        return attributes.find(_ => _.path === sanitisedPath);
    });
}

function getFlexibleContent({ locale, path, previewMode }) {
    const sanitisedPath = sanitiseUrlPath(path);
    return fetch(`/v1/${locale}/flexible-content`, {
        qs: addPreviewParams(previewMode, { path: sanitisedPath })
    }).then(response => response.data.attributes);
}

function getProjectStory({ locale, grantId, previewMode }) {
    return fetch(`/v1/${locale}/project-stories/${grantId}`, {
        qs: addPreviewParams(previewMode)
    }).then(getAttrs);
}

function getProjectStories({ locale, slugs = [] }) {
    return fetchAllLocales(reqLocale => `/v1/${reqLocale}/project-stories`).then(responses => {
        const [enResults, cyResults] = responses.map(mapAttrs);
        const results = mergeWelshBy('slug')(locale, enResults, cyResults);
        return slugs.length > 0 ? filterBySlugs(results, slugs) : results;
    });
}

function getOurPeople({ locale, previewMode = null }) {
    return fetch(`/v1/${locale}/our-people`, {
        qs: addPreviewParams(previewMode)
    }).then(mapAttrs);
}

function getDataStats({ locale, previewMode }) {
    return fetch(`/v1/${locale}/data`, {
        qs: addPreviewParams(previewMode)
    }).then(response => response.data.attributes);
}

function getMerchandise(locale, showAll = false) {
    let params = {};
    if (showAll) {
        params.all = 'true';
    }
    return fetch(`/v1/${locale}/merchandise`, { qs: params }).then(mapAttrs);
}

module.exports = {
    mapAttrs,
    mergeWelshBy,
    // API methods
    getAliases,
    getProjectStory,
    getProjectStories,
    getDataStats,
    getFlexibleContent,
    getFundingProgramme,
    getFundingProgrammes,
    getHeroImage,
    getHomepage,
    getListingPage,
    getMerchandise,
    getOurPeople,
    getResearch,
    getRoutes,
    getStrategicProgrammes,
    getUpdates
};
