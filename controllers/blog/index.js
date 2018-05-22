'use strict';

const { get, isEmpty } = require('lodash');
const { isBilingual, shouldServe } = require('../../modules/pageLogic');
const { injectBlogDetail, injectBlogPosts } = require('../../middleware/inject-content');

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

function buildBreadcrumbs(req, activeItem) {
    const trail = [
        {
            label: req.i18n.__('global.nav.blog'),
            url: req.baseUrl
        }
    ];

    if (activeItem) {
        trail.push(activeItem);
    }

    return trail;
}

function renderPost({ req, res, entry }) {
    res.render('pages/blog/post', {
        entry: entry,
        title: entry.title,
        isBilingual: isBilingual(entry.availableLanguages),
        activeBreadcrumbs: buildBreadcrumbs(req, {
            label: entry.category.title,
            url: entry.category.link
        })
    });
}

function renderListing({ res, title, entries = [], entriesMeta = null, activeBreadcrumbs = [] }) {
    const pagination = buildPagination(entriesMeta.pagination);
    res.render('pages/blog/listing', {
        title,
        entries,
        entriesMeta,
        pagination,
        activeBreadcrumbs
    });
}

function initLanding({ router, routeConfig }) {
    router.get(routeConfig.path, injectBlogPosts, (req, res, next) => {
        const { blogPosts } = res.locals;
        if (blogPosts) {
            const title = req.i18n.__('global.nav.blog');
            const activeBreadcrumbs = buildBreadcrumbs(req);
            renderListing({
                res,
                title,
                entries: blogPosts.entries,
                entriesMeta: blogPosts.meta,
                activeBreadcrumbs
            });
        } else {
            next();
        }
    });
}

function initDetails({ router, routeConfig, sectionPath }) {
    router.get(routeConfig.path, injectBlogDetail, function (req, res) {
        const { blogDetail } = res.locals;
        const pageType = get(blogDetail, 'meta.pageType');

        if (isEmpty(blogDetail)) {
            return res.redirect(sectionPath);
        }

        if (pageType === 'blogpost') {
            return renderPost({
                req: req,
                res: res,
                entry: blogDetail.result
            });
        } else if (pageType === 'authors') {
            const activeAuthor = blogDetail.meta.activeAuthor;

            return renderListing({
                res: res,
                title: `Author: ${activeAuthor.title}`,
                entries: blogDetail.result,
                entriesMeta: blogDetail.meta,
                activeBreadcrumbs: buildBreadcrumbs(req, {
                    label: activeAuthor.title,
                    url: activeAuthor.link
                })
            });
        } else if (pageType === 'category') {
            const activeCategory = blogDetail.meta.activeCategory;

            return renderListing({
                res: res,
                title: `Category: ${activeCategory.title}`,
                entries: blogDetail.result,
                entriesMeta: blogDetail.meta,
                activeBreadcrumbs: buildBreadcrumbs(req, {
                    label: activeCategory.title,
                    url: activeCategory.link
                })
            });
        } else if (pageType === 'tags') {
            const activeTag = blogDetail.meta.activeTag;

            return renderListing({
                res: res,
                title: `Tag: ${activeTag.title}`,
                entries: blogDetail.response,
                entriesMeta: blogDetail.meta,
                activeBreadcrumbs: buildBreadcrumbs(req, {
                    label: activeTag.title,
                    url: activeTag.link
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
