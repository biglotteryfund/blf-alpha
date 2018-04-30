'use strict';

const express = require('express');

const { isBilingual } = require('../../modules/pageLogic');
const { renderNotFoundWithError, redirectWithError } = require('../http-errors');
const { shouldServe } = require('../../modules/pageLogic');
const contentApi = require('../../services/content-api');
const injectHeroImage = require('../../middleware/inject-hero');

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
    router.get(routeConfig.path, injectHeroImage(routeConfig), (req, res) => {
        contentApi
            .getBlogPosts({
                locale: req.i18n.getLocale(),
                page: req.query.page || 1
            })
            .then(result => {
                const title = req.i18n.__('global.nav.blog');
                const activeBreadcrumbs = buildBreadcrumbs(req);
                renderListing({
                    res,
                    title,
                    entries: result.entries,
                    entriesMeta: result.meta,
                    activeBreadcrumbs
                });
            })
            .catch(err => {
                renderNotFoundWithError(req, res, err);
            });
    });
}

function initDetails({ router, routeConfig, sectionPath }) {
    router.get(routeConfig.path, function(req, res) {
        contentApi
            .getBlogDetail({
                locale: req.i18n.getLocale(),
                urlPath: req.path
            })
            .then(response => {
                const pageType = response.meta.pageType;
                if (pageType === 'blogpost') {
                    const entry = response.data.attributes;
                    renderPost({
                        req,
                        res,
                        entry
                    });
                } else if (pageType === 'authors') {
                    const entries = contentApi.mapAttrs(response);
                    const activeAuthor = response.meta.activeAuthor;

                    renderListing({
                        res,
                        title: `Author: ${activeAuthor.title}`,
                        entries,
                        entriesMeta: response.meta,
                        activeBreadcrumbs: buildBreadcrumbs(req, {
                            label: activeAuthor.title,
                            url: activeAuthor.link
                        })
                    });
                } else if (pageType === 'category') {
                    const entries = contentApi.mapAttrs(response);
                    const activeCategory = response.meta.activeCategory;

                    renderListing({
                        res,
                        title: `Category: ${activeCategory.title}`,
                        entries,
                        entriesMeta: response.meta,
                        activeBreadcrumbs: buildBreadcrumbs(req, {
                            label: activeCategory.title,
                            url: activeCategory.link
                        })
                    });
                } else if (pageType === 'tags') {
                    const entries = contentApi.mapAttrs(response);
                    const activeTag = response.meta.activeTag;

                    renderListing({
                        res,
                        title: `Tag: ${activeTag.title}`,
                        entries,
                        entriesMeta: response.meta,
                        activeBreadcrumbs: buildBreadcrumbs(req, {
                            label: activeTag.title,
                            url: activeTag.link
                        })
                    });
                } else {
                    res.redirect(sectionPath);
                }
            })
            .catch(err => {
                redirectWithError(res, err, sectionPath);
            });
    });

    return router;
}

module.exports = (pages, sectionPath) => {
    const router = express.Router();

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
