'use strict';
const find = require('lodash/fp/find');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const head = require('lodash/fp/head');
const map = require('lodash/fp/map');
const pick = require('lodash/pick');

const got = require('got');
const request = require('request-promise-native');
const querystring = require('querystring');

const logger = require('./logger');
const { sanitiseUrlPath, stripTrailingSlashes } = require('./urls');
const { CONTENT_API_URL } = require('./secrets');

const getAttrs = response => get('data.attributes')(response);
const mapAttrs = response => map('attributes')(response.data);

const queryContentApi = got.extend({
    prefixUrl: CONTENT_API_URL,
    headers: { 'user-agent': 'tnlcf-www' },
    hooks: {
        beforeRequest: [
            function(options) {
                logger.debug(`Fetching ${options.url.href}`);
            }
        ]
    }
});

function fetch(urlPath, options) {
    logger.debug(
        `Fetching ${CONTENT_API_URL}${urlPath}${
            options && options.qs ? '?' + querystring.stringify(options.qs) : ''
        }`
    );

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
function addPreviewParams(requestParams = {}, params = {}) {
    const globalParams = pick(requestParams, [
        'social',
        'x-craft-live-preview',
        'x-craft-preview',
        'token'
    ]);
    return Object.assign({}, globalParams, params);
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
                const findCy = find(
                    cyItem => cyItem[propName] === enItem[propName]
                );
                return findCy(cyResults) || enItem;
            })(enResults);
        }
    };
}

/**
 * Build pagination
 * Translate content API pagination into an object for use in views
 */
function _buildPagination(paginationMeta, currentQuery = {}) {
    if (paginationMeta && paginationMeta.total_pages > 1) {
        const currentPage = paginationMeta.current_page;
        const totalPages = paginationMeta.total_pages;
        const prevLink = `?${querystring.stringify({
            ...currentQuery,
            ...{ page: currentPage - 1 }
        })}`;
        const nextLink = `?${querystring.stringify({
            ...currentQuery,
            ...{ page: currentPage + 1 }
        })}`;

        return {
            count: paginationMeta.count,
            total: paginationMeta.total,
            perPage: paginationMeta.per_page,
            currentPage: currentPage,
            totalPages: totalPages,
            prevLink: currentPage > 1 ? prevLink : null,
            nextLink: currentPage < totalPages ? nextLink : null
        };
    }
}

/***********************************************
 * API Methods
 ***********************************************/

function getRoutes() {
    return fetch('/v1/list-routes').then(mapAttrs);
}

function getAliasForLocale({ locale, urlPath }) {
    return fetch(`/v1/${locale}/aliases`)
        .then(mapAttrs)
        .then(matches => {
            const findAlias = find(
                alias => alias.from.toLowerCase() === urlPath.toLowerCase()
            );
            return findAlias(matches);
        });
}

function getAlias(urlPath) {
    const getOrHomepage = getOr('/', 'to');
    return getAliasForLocale({
        locale: 'en',
        urlPath: urlPath
    }).then(enMatch => {
        if (enMatch) {
            return getOrHomepage(enMatch);
        } else {
            return getAliasForLocale({
                locale: 'cy',
                urlPath: urlPath
            }).then(cyMatch => (cyMatch ? getOrHomepage(cyMatch) : null));
        }
    });
}

function getHeroImage({ locale, slug }) {
    return fetch(`/v1/${locale}/hero-image/${slug}`).then(
        response => response.data.attributes
    );
}

function getHomepage({ locale, query = {}, requestParams = {} }) {
    return fetch(`/v1/${locale}/homepage`, {
        qs: addPreviewParams(requestParams, { ...query })
    }).then(response => response.data.attributes);
}

/**
 * Get updates
 * @param options
 * @property {string} options.locale
 * @property {string} [options.type]
 * @property {string} [options.date]
 * @property {string} [options.slug]
 * @property {object} [options.query]
 * @property {object} [options.requestParams]
 */
function getUpdates({
    locale,
    type = null,
    date = null,
    slug = null,
    query = {},
    requestParams = {}
}) {
    if (slug) {
        return fetch(`/v1/${locale}/updates/${type}/${date}/${slug}`, {
            qs: addPreviewParams(requestParams, { ...query })
        }).then(response => {
            return {
                meta: response.meta,
                result: response.data.attributes
            };
        });
    } else {
        return fetch(`/v1/${locale}/updates/${type || ''}`, {
            qs: addPreviewParams(requestParams, {
                ...query,
                ...{ 'page-limit': 10 }
            })
        }).then(response => {
            return {
                meta: response.meta,
                result: mapAttrs(response),
                pagination: _buildPagination(response.meta.pagination, query)
            };
        });
    }
}

function getFundingProgrammes({
    locale,
    page = 1,
    pageLimit = 100,
    showAll = false
}) {
    return fetchAllLocales(reqLocale => `/v2/${reqLocale}/funding-programmes`, {
        qs: { 'page': page, 'page-limit': pageLimit, 'all': showAll === true }
    }).then(responses => {
        const [enResults, cyResults] = responses.map(mapAttrs);
        return {
            meta: head(responses).meta,
            result: mergeWelshBy('slug')(locale, enResults, cyResults)
        };
    });
}

function getRecentFundingProgrammes(locale) {
    return queryContentApi
        .get(`v2/${locale}/funding-programmes`, {
            searchParams: { 'page': 1, 'page-limit': 3, 'newest': true }
        })
        .json()
        .then(response => {
            return {
                meta: response.meta,
                result: mapAttrs(response)
            };
        });
}

function getFundingProgramme({ locale, slug, query = {}, requestParams = {} }) {
    return fetch(`/v2/${locale}/funding-programmes/${slug}`, {
        qs: addPreviewParams(requestParams, { ...query })
    }).then(response => get('data.attributes')(response));
}

function getResearch({
    locale,
    slug = null,
    query = {},
    requestParams = {},
    type = null
}) {
    if (slug) {
        return fetch(`/v1/${locale}/research/${slug}`, {
            qs: addPreviewParams(requestParams, { ...query })
        }).then(getAttrs);
    } else {
        let path = `/v1/${locale}/research`;
        if (type) {
            path += `/${type}`;
        }
        return fetch(path, {
            qs: addPreviewParams(requestParams, { ...query })
        }).then(response => {
            return {
                meta: response.meta,
                result: mapAttrs(response),
                pagination: _buildPagination(response.meta.pagination, query)
            };
        });
    }
}

function getStrategicProgrammes({
    locale,
    slug = null,
    query = {},
    requestParams = {}
}) {
    if (slug) {
        return fetch(`/v1/${locale}/strategic-programmes/${slug}`, {
            qs: addPreviewParams(requestParams, { ...query })
        }).then(response => get('data.attributes')(response));
    } else {
        return fetchAllLocales(
            reqLocale => `/v1/${reqLocale}/strategic-programmes`
        ).then(responses => {
            const [enResults, cyResults] = responses.map(mapAttrs);
            return mergeWelshBy('urlPath')(locale, enResults, cyResults);
        });
    }
}

function getListingPage({ locale, path, query = {}, requestParams = {} }) {
    const sanitisedPath = sanitiseUrlPath(path);
    return fetch(`/v1/${locale}/listing`, {
        qs: addPreviewParams(requestParams, {
            ...query,
            ...{ path: sanitisedPath }
        })
    }).then(response => {
        const attributes = response.data.map(item => item.attributes);
        // @TODO remove the check for attr.path, which will shortly be removed the CMS
        return attributes.find(attr => {
            if (get(attr, 'path')) {
                return attr.path === sanitisedPath;
            } else {
                return attr.linkUrl === stripTrailingSlashes(path);
            }
        });
    });
}

function getFlexibleContent({ locale, path, query = {}, requestParams = {} }) {
    const sanitisedPath = sanitiseUrlPath(path);
    return fetch(`/v1/${locale}/flexible-content`, {
        qs: addPreviewParams(requestParams, {
            ...query,
            ...{ path: sanitisedPath }
        })
    }).then(response => response.data.attributes);
}

function getProjectStory({ locale, grantId, query = {}, requestParams = {} }) {
    return fetch(`/v1/${locale}/project-stories/${grantId}`, {
        qs: addPreviewParams(requestParams, { ...query })
    }).then(getAttrs);
}

function getOurPeople({ locale, requestParams = {} }) {
    return fetch(`/v1/${locale}/our-people`, {
        qs: addPreviewParams(requestParams)
    }).then(mapAttrs);
}

function getDataStats(locale, requestParams = {}) {
    return queryContentApi(`v1/${locale}/data`, {
        searchParams: addPreviewParams(requestParams)
    })
        .json()
        .then(getAttrs);
}

function getMerchandise({ locale, showAll = false } = {}) {
    let params = {};
    if (showAll) {
        params.all = 'true';
    }
    return fetch(`/v1/${locale}/merchandise`, { qs: params }).then(mapAttrs);
}

module.exports = {
    // Exported for tests
    _buildPagination,
    // API methods
    getAlias,
    getProjectStory,
    getDataStats,
    getFlexibleContent,
    getFundingProgramme,
    getFundingProgrammes,
    getRecentFundingProgrammes,
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
