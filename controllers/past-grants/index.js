'use strict';
const path = require('path');
const express = require('express');
const request = require('request-promise-native');
const querystring = require('querystring');
const { concat, pick, isEmpty, get, head } = require('lodash');
const nunjucks = require('nunjucks');
const Raven = require('raven');

const { PAST_GRANTS_API_URI } = require('../../modules/secrets');
const { injectBreadcrumbs, injectHeroImage, injectCopy } = require('../../middleware/inject-content');
const { sMaxAge } = require('../../middleware/cached');
const contentApi = require('../../services/content-api');

const router = express.Router();

/**
 * Combine a ?page param with existing querystrings for grant search
 * @param {object} currentQuery
 * @param {number} page
 */
function makePageLink(currentQuery, page) {
    const withPage = Object.assign({}, currentQuery, { page });
    return '?' + querystring.stringify(withPage);
}

function buildPagination(paginationMeta, currentQuery = {}) {
    if (paginationMeta && paginationMeta.totalPages > 1) {
        const currentPage = paginationMeta.currentPage;
        const totalPages = paginationMeta.totalPages;

        const prevLink = {
            url: makePageLink(currentQuery, currentPage - 1),
            label: 'Previous page'
        };

        const nextLink = {
            url: makePageLink(currentQuery, currentPage + 1),
            label: 'Next page'
        };

        return {
            currentPage: currentPage,
            totalPages: totalPages,
            prevLink: currentPage > 1 ? prevLink : null,
            nextLink: currentPage < totalPages ? nextLink : null
        };
    } else {
        return;
    }
}

/**
 * Pick out an allowed list of query parameters to forward on to the grants API
 * @type {object}
 */
function buildAllowedParams(queryParams) {
    const allowedParams = [
        'q',
        'amount',
        'postcode',
        'programme',
        'year',
        'orgType',
        'sort',
        'country',
        'awardDate',
        'localAuthority',
        'westminsterConstituency',
        'recipient',
        'exclude',
        'limit'
    ];
    return pick(queryParams, allowedParams);
}

/**
 * Append a page number parameter to a map of query parameters
 * @type {object}
 */
function addPaginationParameters(existingParams, pageNumber = 1) {
    return Object.assign({}, existingParams, { page: pageNumber });
}

// Query the API with a set of parameters and return a promise
async function queryGrantsApi(parameters) {
    return request({
        url: PAST_GRANTS_API_URI,
        json: true,
        qs: parameters
    });
}

router.use(sMaxAge('1d'), injectBreadcrumbs, (req, res, next) => {
    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
        label: req.i18n.__('funding.pastGrants.search.title'),
        url: req.baseUrl
    });
    next();
});

router.get(
    '/',
    injectHeroImage('active-plus-communities'),
    injectCopy('funding.pastGrants.search'),
    async (req, res, next) => {
        const facetParams = buildAllowedParams(req.query);
        let queryWithPage = addPaginationParameters(facetParams, req.query.page);
        queryWithPage.locale = res.locals.locale;
        let data;

        try {
            data = await queryGrantsApi(queryWithPage);
        } catch (errorResponse) {
            return res.format({
                html: () => {
                    next(errorResponse.error);
                },
                'application/json': () => {
                    res.status(errorResponse.error.error.status || 400).json({
                        error: errorResponse.error.error
                    });
                }
            });
        }

        res.format({
            // Initial / server-only search
            html: () => {
                res.render(path.resolve(__dirname, './views/index'), {
                    title: res.locals.copy.title,
                    queryParams: isEmpty(facetParams) ? false : facetParams,
                    grants: data.results,
                    facets: data.facets,
                    meta: data.meta,
                    pagination: buildPagination(data.meta.pagination, queryWithPage)
                });
            },

            // AJAX search for client-side app
            'application/json': () => {
                const isRelatedSearch = req.query.related === 'true';

                // Repopulate existing app globals so Nunjucks can read them
                // outside of Express's view engine context
                const context = Object.assign({}, res.locals, req.app.locals, {
                    grants: data.results,
                    pagination: buildPagination(data.meta.pagination, queryWithPage),
                    options: {
                        wrapperClass: isRelatedSearch ? 'flex-grid__item' : false,
                        hidePagination: isRelatedSearch
                    }
                });
                const template = path.resolve(__dirname, './views/ajax-results.njk');

                nunjucks.render(template, context, (renderErr, html) => {
                    if (renderErr) {
                        Raven.captureException(renderErr);
                        res.status(400).json({ error: 'ERR-TEMPLATE-ERROR' });
                    } else {
                        res.json({
                            meta: data.meta,
                            facets: data.facets,
                            resultsHtml: html
                        });
                    }
                });
            }
        });
    }
);

router.get('/grant/:id', injectCopy('funding.pastGrants.search'), async (req, res, next) => {
    try {
        const data = await request({
            url: `${PAST_GRANTS_API_URI}/${req.params.id}`,
            json: true,
            qs: {
                locale: res.locals.locale
            }
        });

        if (data) {
            let fundingProgramme;
            const grant = data.result;
            const grantProgramme = get(grant, 'grantProgramme[0]', false);
            if (grantProgramme && grantProgramme.url && grantProgramme.url.indexOf('/') === -1) {
                try {
                    fundingProgramme = await contentApi.getFundingProgramme({
                        slug: grantProgramme.url,
                        locale: req.i18n.getLocale()
                    });
                } catch (e) {} // eslint-disable-line no-empty
            }

            res.render(path.resolve(__dirname, './views/grant-detail'), {
                title: data.result.title,
                grant: grant,
                fundingProgramme: fundingProgramme,
                breadcrumbs: concat(res.locals.breadcrumbs, { label: data.result.title })
            });
        } else {
            next();
        }
    } catch (error) {
        next(error);
    }
});

router.get('/recipient/:id', injectCopy('funding.pastGrants.search'), async (req, res, next) => {
    try {
        let qs = addPaginationParameters({}, req.query.page);
        qs.recipient = req.params.id;
        qs.locale = res.locals.locale;
        const data = await request({
            url: PAST_GRANTS_API_URI,
            json: true,
            qs: qs
        });

        if (data && data.meta.totalResults > 0) {
            const firstResult = head(data.results);
            const organisation = head(firstResult.recipientOrganization);
            res.render(path.resolve(__dirname, './views/recipient-detail'), {
                title: organisation.name,
                organisation: organisation,
                recipientGrants: data.results,
                recipientProgrammes: data.facets.grantProgramme,
                recipientLocalAuthorities: data.facets.localAuthorities,
                totalAwarded: data.meta.totalAwarded.toLocaleString(),
                totalResults: data.meta.totalResults.toLocaleString(),
                breadcrumbs: concat(res.locals.breadcrumbs, { label: organisation.name }),
                pagination: buildPagination(data.meta.pagination, qs)
            });
        } else {
            next();
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
