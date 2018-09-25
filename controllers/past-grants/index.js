'use strict';
const path = require('path');
const express = require('express');
const request = require('request-promise-native');
const querystring = require('querystring');
const { concat, pick, isEmpty } = require('lodash');

const { PAST_GRANTS_API_URI } = require('../../modules/secrets');
const { injectBreadcrumbs } = require('../../middleware/inject-content');

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

router.use(injectBreadcrumbs, (req, res, next) => {
    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
        label: 'Search past grants',
        url: req.baseUrl
    });
    next();
});

router.get('/', async (req, res) => {
    /**
     * Pick out an allowed list of query parameters for forward on to the grants API
     * @type {object}
     */
    const facetParams = pick(req.query, ['q', 'amount', 'postcode', 'programme', 'year', 'orgType', 'sort']);
    const queryWithPage = Object.assign({}, facetParams, { page: req.query.page || 1 });

    const data = await request({
        url: PAST_GRANTS_API_URI,
        json: true,
        qs: queryWithPage
    });

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
