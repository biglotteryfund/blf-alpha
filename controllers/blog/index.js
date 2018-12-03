'use strict';
const path = require('path');
const express = require('express');
const { concat, get, isEmpty } = require('lodash');
const { injectBreadcrumbs, injectBlogDetail, injectBlogPosts } = require('../../middleware/inject-content');
const { buildPagination } = require('../../modules/pagination');

const router = express.Router();

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

// @TODO remove the route handlers below and merge the redirects into a central place
// (to be removed a few months after, when these links have dropped out of search etc?)
const REDIRECT_BLOGS = true;
if (!REDIRECT_BLOGS) {
    // Blog landing page
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
} else {
    // Redirect old blogs to new ones
    router.get('/', (req, res) => res.redirect('/news/blog'));
    router.get('/authors/:author', (req, res) => res.redirect(`/news/blog?author=${req.params.author}`));
    router.get('/tags/:tag', (req, res) => res.redirect(`/news/blog?tag=${req.params.tag}`));
    router.get('/:category', (req, res) => res.redirect(`/news/blog?category=${req.params.category}`));
    router.get('/:date/:slug', (req, res) => res.redirect(`/news/blog/${req.params.date}/${req.params.slug}`));
}

module.exports = router;
