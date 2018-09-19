'use strict';
const path = require('path');
const express = require('express');
const request = require('request-promise-native');
const querystring = require('querystring');
const { head, sortBy } = require('lodash');

const { PAST_GRANTS_API_URI } = require('../../modules/secrets');

const router = express.Router();

function buildPagination(paginationMeta, currentQuerystring = {}) {
    if (paginationMeta && paginationMeta.totalPages > 1) {
        const currentPage = paginationMeta.currentPage;
        const totalPages = paginationMeta.totalPages;

        // combine a ?page param with existing querystrings for grant search
        const makePageLink = pageNum => {
            return (
                '?' +
                querystring.stringify(
                    Object.assign({}, currentQuerystring, {
                        page: pageNum
                    })
                )
            );
        };

        const prevLink = makePageLink(currentPage - 1);
        const nextLink = makePageLink(currentPage + 1);

        return {
            currentPage: currentPage,
            totalPages: totalPages,
            prevLink:
                currentPage > 1
                    ? {
                          url: prevLink,
                          label: 'prev'
                      }
                    : null,
            nextLink:
                currentPage < totalPages
                    ? {
                          url: nextLink,
                          label: 'next'
                      }
                    : null
        };
    } else {
        return;
    }
}

router.get('/', async (req, res) => {
    const query = {
        page: req.query.page || 1
    };

    if (req.query.q) {
        query.q = req.query.q;
    }

    if (req.query.postcode) {
        query.postcode = req.query.postcode;
    }

    if (req.query.programme) {
        query.programme = req.query.programme;
    }

    if (req.query.orgType) {
        query.orgType = req.query.orgType;
    }

    const data = await request({
        url: PAST_GRANTS_API_URI,
        json: true,
        qs: query
    });
    
    res.render(path.resolve(__dirname, './views/past-grants'), {
        title: 'Past grants search',
        queryParams: req.query,
        grants: data.results,
        facets: data.facets,
        meta: data.meta,
        pagination: buildPagination(data.meta.pagination, req.query)
    });
});

module.exports = router;
