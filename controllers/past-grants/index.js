'use strict';
const path = require('path');
const express = require('express');
const request = require('request-promise-native');
const querystring = require('querystring');
const { concat, pick, isEmpty, get } = require('lodash');
const nunjucks = require('nunjucks');
const Raven = require('raven');
const moment = require('moment');

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
    const allowedParams = [
        'q',
        'amount',
        'postcode',
        'programme',
        'year',
        'orgType',
        'sort',
        'country',
        'localAuthority',
        'constituency',
        'recipient'
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

function projectIsActive(project) {
    const endDate = get(project, 'plannedDates[0].endDate', false);
    const endsBeforeNow = moment(endDate).isBefore(moment());
    return endDate ? !endsBeforeNow : false;
}

router.use(sMaxAge('1d'), injectBreadcrumbs, (req, res, next) => {
    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
        label: 'Search past grants',
        url: req.baseUrl
    });
    res.locals.projectIsActive = projectIsActive;
    next();
});

router.get('/', async (req, res, next) => {
    const facetParams = buildAllowedParams(req.query);
    const queryWithPage = addPaginationParameters(facetParams, req.query.page);
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
                title: 'Search Past Grants',
                queryParams: isEmpty(facetParams) ? false : facetParams,
                grants: data.results,
                facets: data.facets,
                meta: data.meta,
                pagination: buildPagination(data.meta.pagination, queryWithPage)
            });
        },

        // AJAX search for client-side app
        'application/json': () => {
            // Repopulate existing app globals so Nunjucks can read them
            // outside of Express's view engine context
            const context = Object.assign({}, res.locals, req.app.locals, {
                grants: data.results,
                pagination: buildPagination(data.meta.pagination, queryWithPage)
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
});

router.get('/:id', async (req, res, next) => {
    try {
        const data = await request({
            url: `${PAST_GRANTS_API_URI}/${req.params.id}`,
            json: true
        });

        if (data) {
            res.render(path.resolve(__dirname, './views/grant-detail'), {
                title: data.result.title,
                grant: data.result,
                breadcrumbs: concat(res.locals.breadcrumbs, { label: data.result.title })
            });
        } else {
            next();
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
