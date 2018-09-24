'use strict';
const path = require('path');
const express = require('express');
const request = require('request-promise-native');
const querystring = require('querystring');
const { pick, isEmpty } = require('lodash');

const { PAST_GRANTS_API_URI } = require('../../modules/secrets');

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

router.get('/', async (req, res) => {
    /**
     * Pick out an allowed list of query parameters for forward on to the grants API
     * @type {object}
     */
    const facetParams = pick(req.query, ['q', 'postcode', 'programme', 'year', 'orgType']);
    const queryWithPage = Object.assign({}, facetParams, { page: req.query.page || 1 });

    const data = await request({
        url: PAST_GRANTS_API_URI,
        json: true,
        qs: queryWithPage
    });

    res.render(path.resolve(__dirname, './views/past-grants'), {
        title: 'Past grants search',
        queryParams: isEmpty(facetParams) ? false : facetParams,
        grants: data.results,
        facets: data.facets,
        meta: data.meta,
        pagination: buildPagination(data.meta.pagination, queryWithPage)
    });
});

module.exports = router;
