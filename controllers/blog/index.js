'use strict';
const path = require('path');
const { concat, get, isEmpty } = require('lodash');
const { isBilingual, shouldServe } = require('../../modules/pageLogic');
const { injectBreadcrumbs, injectBlogDetail, injectBlogPosts } = require('../../middleware/inject-content');

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

function initLanding({ router, routeConfig }) {
    router.get(routeConfig.path, injectBreadcrumbs, injectBlogPosts, (req, res, next) => {
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
}

function initDetails({ router, routeConfig, sectionPath }) {
    router.get(routeConfig.path, injectBreadcrumbs, injectBlogDetail, function(req, res) {
        const { blogDetail } = res.locals;
        const pageType = get(blogDetail, 'meta.pageType');

        if (isEmpty(blogDetail)) {
            return res.redirect(sectionPath);
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
            return res.redirect(sectionPath);
        }
    });

    return router;
}

module.exports = ({ router, pages, sectionPath }) => {
    if (shouldServe(pages.root)) {
        initLanding({
            router: router,
            routeConfig: pages.root
        });

        initDetails({
            router: router,
            routeConfig: pages.articles,
            sectionPath: sectionPath
        });
    }

    return router;
};
