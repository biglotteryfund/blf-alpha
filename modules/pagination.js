'use strict';
const querystring = require('querystring');

/**
 * Build pagination
 * Translate content API pagination into an object for use in views
 */
function buildPagination(paginationMeta, currentQuery = {}) {
    if (paginationMeta && paginationMeta.total_pages > 1) {
        const currentPage = paginationMeta.current_page;
        const totalPages = paginationMeta.total_pages;
        const prevLink = `?${querystring.stringify({ ...currentQuery, ...{ page: currentPage - 1 } })}`;
        const nextLink = `?${querystring.stringify({ ...currentQuery, ...{ page: currentPage + 1 } })}`;

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
