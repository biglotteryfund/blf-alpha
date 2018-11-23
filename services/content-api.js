'use strict';
const { find, filter, get, getOr, head, map, sortBy, take } = require('lodash/fp');
const { isArray } = require('lodash');
const request = require('request-promise-native');
const debug = require('debug')('biglotteryfund:content-api');

const mapAttrs = response => map('attributes')(response.data);

const { sanitiseUrlPath } = require('../modules/urls');
let { CONTENT_API_URL } = require('../modules/secrets');

function fetch(urlPath, options = {}) {
    debug(`Fetching ${urlPath}`);
    return request({
        ...{
            url: `${CONTENT_API_URL}${urlPath}`,
            json: true
        },
        ...options
    });
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

function getBlogPosts({ locale, page = 1, pageLimit = 10, previewMode = null }) {
    return fetch(`/v1/${locale}/blog`, {
        qs: addPreviewParams(previewMode, { page: page, 'page-limit': pageLimit })
    }).then(response => {
        return {
            entries: mapAttrs(response),
            meta: response.meta
        };
    });
}

function getBlogDetail({ locale, urlPath, previewMode = null }) {
    return fetch(`/v1/${locale}/blog${urlPath}`, {
        qs: addPreviewParams(previewMode)
    }).then(response => {
        const result = isArray(response.data) ? mapAttrs(response) : response.data.attributes;

        return {
            meta: response.meta,
            result: result
        };
    });
}

// @TODO this should merge locales like below as not all entries will have translations
function getUpdates({ locale, urlPath = '', query = {}, previewMode = false }) {
    return fetch(`/v1/${locale}/updates${urlPath}`, {
        qs: addPreviewParams(previewMode, { ...query, ...{ 'page-limit': 10 } })
    }).then(response => {
        const result = isArray(response.data) ? mapAttrs(response) : response.data.attributes;
        return {
            meta: response.meta,
            result: result
        };
    });
}

function getFundingProgrammes({ locale, page = 1, showAll = false }) {
    const query = { page: page, 'page-limit': 100 };
    if (showAll) {
        query['page-limit'] = 10;
        query.all = true;
    }

    return fetchAllLocales(reqLocale => `/v2/${reqLocale}/funding-programmes`, {
        qs: query
    }).then(responses => {
        const [enResults, cyResults] = responses.map(mapAttrs);
        return {
            meta: head(responses).meta,
            result: mergeWelshBy('urlPath')(locale, enResults, cyResults)
        };
    });
}

function getFundingProgramme({ locale, slug, previewMode = false }) {
    return fetch(`/v2/${locale}/funding-programmes/${slug}`, {
        qs: addPreviewParams(previewMode)
    }).then(response => {
        return get('data.attributes')(response);
    });
}

function getResearch({ locale, slug = null, searchQuery = null, previewMode = null }) {
    if (slug) {
        return fetch(`/v1/${locale}/research/${slug}`, {
            qs: addPreviewParams(previewMode)
        }).then(response => get('data.attributes')(response));
    } else {
        const baseUrl = `/v1/${locale}/research`;
        const url = searchQuery ? `${baseUrl}?q=${searchQuery}` : baseUrl;
        return fetch(url).then(mapAttrs);
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
    }).then(response => {
        return response.data.attributes;
    });
}

function getCaseStudies({ locale, slugs = [] }) {
    return fetchAllLocales(reqLocale => `/v1/${reqLocale}/case-studies`).then(responses => {
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

function getStatRegions(locale) {
    return fetch(`/v1/${locale}/stat-regions`).then(mapAttrs);
}

function getAliases({ locale }) {
    return fetch(`/v1/${locale}/aliases`).then(mapAttrs);
}

function getMerchandise(locale, showAll = false) {
    let params = {};
    if (showAll) {
        params.all = 'true';
    }
    return fetch(`/v1/${locale}/merchandise`, { qs: params }).then(mapAttrs);
}

function getRoutes() {
    return fetch('/v1/list-routes').then(mapAttrs);
}

module.exports = {
    mapAttrs,
    mergeWelshBy,
    // API methods
    getAliases,
    getBlogDetail,
    getBlogPosts,
    getUpdates,
    getCaseStudies,
    getFlexibleContent,
    getFundingProgramme,
    getFundingProgrammes,
    getResearch,
    getStrategicProgrammes,
    getHeroImage,
    getHomepage,
    getListingPage,
    getMerchandise,
    getOurPeople,
    getPromotedNews,
    getRoutes,
    getStatRegions,
    getDataStats
};
