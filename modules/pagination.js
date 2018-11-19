'use strict';
const querystring = require('querystring');

/**
 * Build pagination
 * Translate content API pagination into an object for use in views
 */
function buildPagination(paginationMeta, additionalParams = {}) {
    if (paginationMeta && paginationMeta.total_pages > 1) {
        const currentPage = paginationMeta.current_page;
        const totalPages = paginationMeta.total_pages;

        let prevLink =
            currentPage > 1 ? '?' + querystring.stringify({ ...additionalParams, ...{ page: currentPage - 1 } }) : null;
        let nextLink =
            currentPage < totalPages
                ? '?' + querystring.stringify({ ...additionalParams, ...{ page: currentPage + 1 } })
                : null;

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

module.exports = {
    buildPagination
};
