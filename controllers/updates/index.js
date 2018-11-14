'use strict';
const path = require('path');
const express = require('express');
const { concat, isArray, pick, get } = require('lodash');

const router = express.Router();

const { injectBreadcrumbs } = require('../../middleware/inject-content');
const { getUpdates } = require('../../services/content-api');
const appData = require('../../modules/appData');
const { buildPagination } = require('../../modules/pagination');

function renderListing({ res, title, entries = [], entriesMeta = null, breadcrumbs = [], isNewsLandingPage = false }) {
    const pagination = buildPagination(entriesMeta.pagination);
    res.render(path.resolve(__dirname, './views/listing'), {
        title,
        entries,
        entriesMeta,
        pagination,
        breadcrumbs,
        isNewsLandingPage
    });
}

if (appData.isNotProduction) {
    router.get('/:type?/:date?/:slug?', injectBreadcrumbs, async (req, res, next) => {
        let urlPath = '';
        let query = {};

        const isSinglePost = req.params.date && req.params.slug;

        if (req.params.type) {
            urlPath += `/${req.params.type}`;
        }

        if (isSinglePost) {
            urlPath += `/${req.params.date}/${req.params.slug}`;
        } else {
            // Listings can be filtered by the following valid query parameters
            query = pick(req.query, ['page', 'tag', 'author', 'category']);
        }

        try {
            const response = await getUpdates({
                locale: req.i18n.getLocale(),
                urlPath: urlPath,
                query: query
            });

            if (response.result) {
                // Do we have a listing page?
                if (isArray(response.result)) {
                    // @TODO i18n for 'All news' and pageTitles below
                    // Is this a specific listing page (eg. blog, press releases) or everything?
                    const filterType = get(response, 'meta.pageType');
                    const isNewsLandingPage = !req.params.type && filterType === 'single';
                    // @TODO these titles are singular - should they be pluralised here manually or in the CMS?
                    let pageTitle = isNewsLandingPage ? 'All news' : response.result[0].updateType.name;
                    let filterLabel;

                    if (filterType === 'author') {
                        filterLabel = get(response, 'meta.activeAuthor');
                        pageTitle = `Author: ${filterLabel.title}`;
                    } else if (filterType === 'tag') {
                        filterLabel = get(response, 'meta.activeTag');
                        pageTitle = `Tag: ${filterLabel.title}`;
                    } else if (filterType === 'category') {
                        filterLabel = get(response, 'meta.activeCategory');
                        pageTitle = `Category: ${filterLabel.title}`;
                    }

                    let breadcrumbs = res.locals.breadcrumbs;
                    if (filterLabel) {
                        breadcrumbs = concat(res.locals.breadcrumbs, {
                            label: filterLabel.title
                        });
                    } else {
                        breadcrumbs = concat(res.locals.breadcrumbs, {
                            label: pageTitle
                        });
                    }

                    return renderListing({
                        res,
                        title: pageTitle,
                        entries: response.result,
                        entriesMeta: response.meta,
                        breadcrumbs: breadcrumbs,
                        isNewsLandingPage: isNewsLandingPage
                    });
                } else {
                    // Single entry page
                    if (req.baseUrl + req.path !== response.result.linkUrl) {
                        // Prevent URL tampering with dates, since we don't validate them on the API end
                        res.redirect(response.result.linkUrl);
                    } else {
                        return res.render(path.resolve(__dirname, './views/post'), {
                            title: response.result.title,
                            entry: response.result,
                            breadcrumbs: concat(
                                res.locals.breadcrumbs,
                                {
                                    label: response.result.updateType.name,
                                    url: res.locals.localify(`${req.baseUrl}/${req.params.type}`)
                                },
                                {
                                    label: response.result.title
                                }
                            )
                        });
                    }
                }
            } else {
                next();
            }
        } catch (e) {
            next(e);
        }
    });
}

module.exports = router;
