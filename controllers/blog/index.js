'use strict';

const { isBilingual } = require('../../modules/pageLogic');
const { shouldServe } = require('../../modules/pageLogic');
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
    router.get(routeConfig.path, injectBlogDetail, function(req, res) {
        const { blogDetail } = res.locals;

        if (!blogDetail) {
            res.redirect(sectionPath);
        }

        if (blogDetail.meta.pageType === 'blogpost') {
            renderPost({
                req: req,
                res: res,
                entry: blogDetail.result
            });
        } else if (blogDetail.meta.pageType === 'authors') {
            const activeAuthor = blogDetail.meta.activeAuthor;

            renderListing({
                res: res,
                title: `Author: ${activeAuthor.title}`,
                entries: blogDetail.result,
                entriesMeta: blogDetail.meta,
                activeBreadcrumbs: buildBreadcrumbs(req, {
                    label: activeAuthor.title,
                    url: activeAuthor.link
                })
            });
        } else if (blogDetail.meta.pageType === 'category') {
            const activeCategory = blogDetail.meta.activeCategory;

            renderListing({
                res: res,
                title: `Category: ${activeCategory.title}`,
                entries: blogDetail.result,
                entriesMeta: blogDetail.meta,
                activeBreadcrumbs: buildBreadcrumbs(req, {
                    label: activeCategory.title,
                    url: activeCategory.link
                })
            });
        } else if (blogDetail.meta.pageType === 'tags') {
            const activeTag = blogDetail.meta.activeTag;

            renderListing({
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
            res.redirect(sectionPath);
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
