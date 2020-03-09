'use strict';
const countBy = require('lodash/countBy');
const filter = require('lodash/fp/filter');
const find = require('lodash/fp/find');
const flatten = require('lodash/flatten');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const head = require('lodash/fp/head');
const map = require('lodash/fp/map');
const pick = require('lodash/pick');
const sortBy = require('lodash/fp/sortBy');
const uniqBy = require('lodash/uniqBy');

const request = require('request-promise-native');
const querystring = require('querystring');

const logger = require('./logger');

const getAttrs = response => get('data.attributes')(response);
const mapAttrs = response => map('attributes')(response.data);

const { sanitiseUrlPath, stripTrailingSlashes } = require('./urls');
let { CONTENT_API_URL } = require('./secrets');

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

function filterBySlugs(list, slugs) {
    const matches = filter(result => slugs.indexOf(result.slug) !== -1)(list);
    return sortBy(item => slugs.indexOf(item.slug))(matches);
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

function getRecentFundingProgrammes({ locale, limit = 3 }) {
    return fetch(`/v2/${locale}/funding-programmes`, {
        qs: { 'page': 1, 'page-limit': limit, 'newest': true }
    }).then(response => {
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

function getPublications({
    locale,
    programme,
    slug = null,
    requestParams = {}
}) {
    const filteredRequestParams = pick(requestParams, [
        'page',
        'tag',
        'q',
        'sort'
    ]);

    const apiRequestParams = {
        // Override default page-limit
        ...{ 'page-limit': 10 },
        ...filteredRequestParams
    };

    const baseUrl = `/v1/${locale}/funding/publications/${programme}`;
    if (slug) {
        return fetch(`${baseUrl}/${slug}`, {
            qs: addPreviewParams(requestParams, apiRequestParams)
        }).then(response => {
            return {
                meta: response.meta,
                entry: getAttrs(response)
            };
        });
    } else {
        return fetch(baseUrl, {
            qs: addPreviewParams(requestParams, apiRequestParams)
        }).then(response => {
            return {
                meta: response.meta,
                result: mapAttrs(response),
                pagination: _buildPagination(
                    response.meta.pagination,
                    apiRequestParams
                )
            };
        });
    }
}

function getPublicationTags({ locale, programme }) {
    return fetch(`/v1/${locale}/funding/publications/${programme}/tags`).then(
        response => {
            const attrs = mapAttrs(response);
            // Strip entries to just their tags
            const allTags = flatten(attrs.map(_ => _.tags));
            // Count the occurrences of each tag
            const counts = countBy(allTags, 'id');
            // Merge these counts into the tag list after de-duping
            const tags = uniqBy(allTags, 'id').map(tag => {
                tag.count = counts[tag.id];
                return tag;
            });
            return sortBy('count')(tags).reverse();
        }
    );
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

function getProjectStories({ locale, slugs = [] }) {
    return fetchAllLocales(
        reqLocale => `/v1/${reqLocale}/project-stories`
    ).then(responses => {
        const [enResults, cyResults] = responses.map(mapAttrs);
        const results = mergeWelshBy('slug')(locale, enResults, cyResults);
        return slugs.length > 0 ? filterBySlugs(results, slugs) : results;
    });
}

function getOurPeople({ locale, requestParams = {} }) {
    return fetch(`/v1/${locale}/our-people`, {
        qs: addPreviewParams(requestParams)
    }).then(mapAttrs);
}

function getDataStats({ locale, query = {}, requestParams = {} }) {
    return fetch(`/v1/${locale}/data`, {
        qs: addPreviewParams(requestParams, { ...query })
    }).then(response => response.data.attributes);
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
    getProjectStories,
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
    getPublications,
    getPublicationTags,
    getResearch,
    getRoutes,
    getStrategicProgrammes,
    getUpdates
};
