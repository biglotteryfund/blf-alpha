'use strict';
const path = require('path');
const express = require('express');
const request = require('request-promise-native');
const querystring = require('querystring');
const { concat, pick, isEmpty } = require('lodash');
const nunjucks = require('nunjucks');
const Raven = require('raven');

const { PAST_GRANTS_API_URI } = require('../../modules/secrets');
const { injectBreadcrumbs } = require('../../middleware/inject-content');
const { sMaxAge } = require('../../middleware/cached');

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
    const allowedParams = ['q', 'amount', 'postcode', 'programme', 'year', 'orgType', 'sort', 'country'];
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
        label: 'Search past grants',
        url: req.baseUrl
    });
    next();
});

router
    .route('/')
    .post(async (req, res) => {
        // @TODO how can this handle page numbers / sort options?
        // Do we need hidden input fields?
        const queryWithPage = addPaginationParameters(buildAllowedParams(req.body), req.body.page);
        const grantData = await queryGrantsApi(queryWithPage);

        // Repopulate existing app globals so Nunjucks can read them
        // outside of Express's view engine context
        const context = Object.assign({}, res.locals, { grants: grantData.results });
        const template = path.resolve(__dirname, './views/ajax-results.njk');

        nunjucks.render(template, context, (renderErr, html) => {
            if (renderErr) {
                Raven.captureException(renderErr);
                res.json({
                    status: 'error'
                });
            } else {
                res.json({
                    status: 'success',
                    meta: grantData.meta,
                    facets: grantData.facets,
                    resultsHtml: html
                });
            }
        });
    })
    .get(async (req, res) => {
        const facetParams = buildAllowedParams(req.query);
        const queryWithPage = addPaginationParameters(facetParams, req.query.page);
        const data = await queryGrantsApi(queryWithPage);

        const commonSortOptions = [
            {
                label: 'Oldest first',
                value: 'awardDate|desc'
            },
            {
                label: 'Lowest amount first',
                value: 'amountAwarded|asc'
            },
            {
                label: 'Highest amount first',
                value: 'amountAwarded|desc'
            }
        ];

        let sortOptions = [];
        if (facetParams.q) {
            sortOptions = concat(
                [
                    {
                        label: 'Most relevant first',
                        value: ''
                    },
                    {
                        label: 'Newest first',
                        value: 'awardDate|asc'
                    }
                ],
                commonSortOptions
            );
        } else {
            sortOptions = concat(
                [
                    {
                        label: 'Newest first',
                        value: ''
                    }
                ],
                commonSortOptions
            );
        }

        res.render(path.resolve(__dirname, './views/index'), {
            title: 'Past grants search',
            queryParams: isEmpty(facetParams) ? false : facetParams,
            grants: data.results,
            facets: data.facets,
            meta: data.meta,
            sortOptions: sortOptions,
            pagination: buildPagination(data.meta.pagination, queryWithPage)
        });
    });

router.get('/:id', async (req, res, next) => {
    try {
        const data = await request({
            url: `${PAST_GRANTS_API_URI}/${req.params.id}`,
            json: true
        });

        if (data) {
            res.render(path.resolve(__dirname, './views/grant-detail'), {
                title: data.title,
                grant: data,
                breadcrumbs: concat(res.locals.breadcrumbs, { label: data.title })
            });
        } else {
            next();
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
