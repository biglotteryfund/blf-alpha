'use strict';
const path = require('path');
const express = require('express');
const { concat, get, isEmpty } = require('lodash');
const { isBilingual } = require('../../modules/pageLogic');
const { injectBreadcrumbs, injectBlogDetail, injectBlogPosts } = require('../../middleware/inject-content');

const router = express.Router();

/**
 * Build pagination
 * Translate content API pagination into an object for use in views
 */
function buildPagination(paginationMeta) {
    if (paginationMeta && paginationMeta.total_pages > 1) {
        const currentPage = paginationMeta.current_page;
        const totalPages = paginationMeta.total_pages;
        const prevLink = `?page=${currentPage - 1}`;
        const nextLink = `?page=${currentPage + 1}`;

        return {
            count: paginationMeta.count,
            total: paginationMeta.total,
            perPage: paginationMeta.per_page,
            currentPage: currentPage,
            totalPages: totalPages,
            prevLink: currentPage > 1 ? prevLink : null,
            nextLink: currentPage < totalPages ? nextLink : null
        };
    } else {
        return;
    }
}

function renderListing({ res, title, entries = [], entriesMeta = null, breadcrumbs = [] }) {
    const pagination = buildPagination(entriesMeta.pagination);
    res.render(path.resolve(__dirname, './views/listing'), {
        title,
        entries,
        entriesMeta,
        pagination,
        breadcrumbs
    });
}

router.get('/', injectBreadcrumbs, injectBlogPosts, (req, res, next) => {
    const { blogPosts, breadcrumbs } = res.locals;
    if (blogPosts) {
        const title = req.i18n.__('global.nav.blog');
        renderListing({
            res,
            title,
            entries: blogPosts.entries,
            entriesMeta: blogPosts.meta,
            breadcrumbs: breadcrumbs
        });
    } else {
        next();
    }
});

router.get('/*', injectBreadcrumbs, injectBlogDetail, function(req, res) {
    const { blogDetail } = res.locals;
    const pageType = get(blogDetail, 'meta.pageType');

    if (isEmpty(blogDetail)) {
        return res.redirect(req.baseUrl);
    }

    if (pageType === 'blogpost') {
        const entry = blogDetail.result;

        res.render(path.resolve(__dirname, './views/post'), {
            entry: entry,
            title: entry.title,
            isBilingual: isBilingual(entry.availableLanguages),
            breadcrumbs: concat(res.locals.breadcrumbs, {
                label: entry.category.title
            })
        });
    } else if (pageType === 'authors') {
        const activeAuthor = blogDetail.meta.activeAuthor;

        return renderListing({
            res: res,
            title: `Author: ${activeAuthor.title}`,
            entries: blogDetail.result,
            entriesMeta: blogDetail.meta,
            breadcrumbs: concat(res.locals.breadcrumbs, {
                label: activeAuthor.title
            })
        });
    } else if (pageType === 'category') {
        const activeCategory = blogDetail.meta.activeCategory;

        return renderListing({
            res: res,
            title: `Category: ${activeCategory.title}`,
            entries: blogDetail.result,
            entriesMeta: blogDetail.meta,
            breadcrumbs: concat(res.locals.breadcrumbs, {
                label: activeCategory.title
            })
        });
    } else if (pageType === 'tags') {
        const activeTag = blogDetail.meta.activeTag;

        return renderListing({
            res: res,
            title: `Tag: ${activeTag.title}`,
            entries: blogDetail.result,
            entriesMeta: blogDetail.meta,
            breadcrumbs: concat(res.locals.breadcrumbs, {
                label: activeTag.title
            })
        });
    } else {
        return res.redirect(req.baseUrl);
    }
});

module.exports = router;
