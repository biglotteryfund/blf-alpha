'use strict';
const request = require('request-promise-native');

function buildPagination(paginationMeta) {
    if (paginationMeta && paginationMeta.totalPages > 1) {
        const currentPage = paginationMeta.currentPage;
        const totalPages = paginationMeta.totalPages;
        const prevLink = `?page=${currentPage - 1}`;
        const nextLink = `?page=${currentPage + 1}`;

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

async function init({ router, routeConfig }) {
    router.get(routeConfig.path, async (req, res) => {
        const query = {
            page: req.query.page || 1
        };

        if (req.query.q) {
            query.q = req.query.q;
        }

        const data = await request({
            url: `http://localhost:8888`,
            json: true,
            qs: query
        });

        res.render(routeConfig.template, {
            queryParams: req.query,
            grants: data.results,
            facets: data.facets,
            meta: data.meta,
            pagination: buildPagination(data.meta.pagination)
        });
    });
}

module.exports = {
    init
};
