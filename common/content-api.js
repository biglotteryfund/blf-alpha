'use strict';
const find = require('lodash/fp/find');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const head = require('lodash/fp/head');
const map = require('lodash/fp/map');
const pick = require('lodash/pick');

const got = require('got');
const querystring = require('querystring');

const { CONTENT_API_URL } = require('./secrets');
const { sanitiseUrlPath, stripTrailingSlashes } = require('./urls');
const logger = require('./logger');

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

const getAttrs = response => get('data.attributes')(response);
const mapAttrs = response => map('attributes')(response.data);

/**
 * Adds the preview parameters to the request
 * (if accessed via the preview domain)
 */
function withPreviewParams(rawSearchParams = {}, extraSearchParams = {}) {
    const globalParams = pick(rawSearchParams, [
        'social',
        'x-craft-live-preview',
        'x-craft-preview',
        'token'
    ]);
    return Object.assign({}, globalParams, extraSearchParams);
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
    return queryContentApi
        .get('v1/list-routes')
        .json()
        .then(mapAttrs);
}

function getAliasForLocale({ locale, urlPath }) {
    return queryContentApi
        .get(`v1/${locale}/aliases`)
        .json()
        .then(mapAttrs)
        .then(matches =>
            find(alias => alias.from.toLowerCase() === urlPath.toLowerCase())(
                matches
            )
        );
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
    return queryContentApi
        .get(`v1/${locale}/hero-image/${slug}`)
        .json()
        .then(getAttrs);
}

function getHomepage(locale, searchParams = {}) {
    return queryContentApi
        .get(`v1/${locale}/homepage`, {
            searchParams: withPreviewParams(searchParams)
        })
        .json()
        .then(getAttrs);
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
    searchParams = {}
}) {
    const extraSearchParams = pick(searchParams, [
        'page',
        'tag',
        'author',
        'category',
        'region'
    ]);

    if (slug) {
        return queryContentApi
            .get(`v1/${locale}/updates/${type}/${date}/${slug}`, {
                searchParams: withPreviewParams(searchParams, extraSearchParams)
            })
            .json()
            .then(response => {
                return {
                    meta: response.meta,
                    result: response.data.attributes
                };
            });
    } else {
        return queryContentApi
            .get(`v1/${locale}/updates/${type || ''}`, {
                searchParams: withPreviewParams(searchParams, {
                    ...extraSearchParams,
                    ...{ 'page-limit': 10 }
                })
            })
            .json()
            .then(response => {
                return {
                    meta: response.meta,
                    result: mapAttrs(response),
                    pagination: _buildPagination(
                        response.meta.pagination,
                        searchParams
                    )
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
    const requestOptions = {
        searchParams: {
            'page': page,
            'page-limit': pageLimit,
            'all': showAll === true
        }
    };

    return Promise.all([
        queryContentApi.get('v2/en/funding-programmes', requestOptions).json(),
        queryContentApi.get('v2/cy/funding-programmes', requestOptions).json()
    ]).then(responses => {
        const [enResults, cyResults] = responses.map(mapAttrs);
        return {
            meta: head(responses).meta,
            result: mergeWelshBy('slug')(locale, enResults, cyResults)
        };
    });
}

function getRecentFundingProgrammes({ locale, limit = 3 }) {
    return queryContentApi
        .get(`v2/${locale}/funding-programmes`, {
            searchParams: { 'page': 1, 'page-limit': limit, 'newest': true }
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
    return queryContentApi
        .get(`v2/${locale}/funding-programmes/${slug}`, {
            searchParams: withPreviewParams(requestParams, { ...query })
        })
        .json()
        .then(getAttrs);
}

function getResearch({
    locale,
    slug = null,
    query = {},
    requestParams = {},
    type = null
}) {
    if (slug) {
        return queryContentApi
            .get(`v1/${locale}/research/${slug}`, {
                searchParams: withPreviewParams(requestParams, { ...query })
            })
            .json()
            .then(getAttrs);
    } else {
        const path = type
            ? `v1/${locale}/research/${type}`
            : `v1/${locale}/research`;

        return queryContentApi
            .get(path, {
                searchParams: withPreviewParams(requestParams, { ...query })
            })
            .json()
            .then(response => {
                return {
                    meta: response.meta,
                    result: mapAttrs(response),
                    pagination: _buildPagination(
                        response.meta.pagination,
                        query
                    )
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
        return queryContentApi
            .get(`v1/${locale}/strategic-programmes/${slug}`, {
                searchParams: withPreviewParams(requestParams, { ...query })
            })
            .json()
            .then(response => get('data.attributes')(response));
    } else {
        return Promise.all([
            queryContentApi.get('v1/en/strategic-programmes').json(),
            queryContentApi.get('v1/cy/strategic-programmes').json()
        ]).then(responses => {
            const [enResults, cyResults] = responses.map(mapAttrs);
            return mergeWelshBy('urlPath')(locale, enResults, cyResults);
        });
    }
}

function getListingPage({ locale, path, query = {}, requestParams = {} }) {
    const sanitisedPath = sanitiseUrlPath(path);
    return queryContentApi
        .get(`v1/${locale}/listing`, {
            searchParams: withPreviewParams(requestParams, {
                ...query,
                ...{ path: sanitisedPath }
            })
        })
        .json()
        .then(response => {
            // @TODO remove the check for attr.path, which will shortly be removed the CMS
            return mapAttrs(response).find(attr => {
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
    return queryContentApi
        .get(`v1/${locale}/flexible-content`, {
            searchParams: withPreviewParams(requestParams, {
                ...query,
                ...{ path: sanitisedPath }
            })
        })
        .json()
        .then(response => response.data.attributes);
}

function getProjectStory({ locale, grantId, query = {}, requestParams = {} }) {
    return queryContentApi
        .get(`v1/${locale}/project-stories/${grantId}`, {
            searchParams: withPreviewParams(requestParams, { ...query })
        })
        .json()
        .then(getAttrs);
}

function getOurPeople({ locale, requestParams = {} }) {
    return queryContentApi
        .get(`v1/${locale}/our-people`, {
            searchParams: withPreviewParams(requestParams)
        })
        .json()
        .then(mapAttrs);
}

function getDataStats({ locale, query = {}, requestParams = {} }) {
    return queryContentApi
        .get(`v1/${locale}/data`, {
            searchParams: withPreviewParams(requestParams, { ...query })
        })
        .json()
        .then(getAttrs);
}

function getMerchandise({ locale, showAll = false } = {}) {
    let params = {};
    if (showAll) {
        params.all = 'true';
    }
    return queryContentApi
        .get(`v1/${locale}/merchandise`, { searchParams: params })
        .json()
        .then(mapAttrs);
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
