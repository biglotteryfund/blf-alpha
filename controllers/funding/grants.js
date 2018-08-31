'use strict';
const request = require('request-promise-native');
const querystring = require('querystring');
const { groupBy } = require('lodash');
const { PAST_GRANTS_API_URI } = require('../../modules/secrets');

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

async function init({ router, routeConfig }) {
    router.get(routeConfig.path, async (req, res) => {
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

        // regroup organisation type data into tree structure
        // @TODO replace this with properly-filtered data so we can do this natively
        if (data.facets && data.facets[0].orgType) {
            data.facets[0].orgType = groupBy(data.facets[0].orgType, o => o._id.split(' : ')[0]);
            for (let type in data.facets[0].orgType) {
                data.facets[0].orgType[type] = data.facets[0].orgType[type].map(o => {
                    o.title = o._id.split(' : ')[1];
                    return o;
                });
            }
        }

        res.render(routeConfig.template, {
            queryParams: req.query,
            grants: data.results,
            facets: data.facets,
            meta: data.meta,
            pagination: buildPagination(data.meta.pagination, req.query)
        });
    });
}

module.exports = {
    init
};
