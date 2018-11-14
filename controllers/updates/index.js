'use strict';
const path = require('path');
const express = require('express');
const { concat, isArray, pick, get, head } = require('lodash');

const router = express.Router();

const { injectBreadcrumbs, injectCopy } = require('../../middleware/inject-content');
const { getUpdates } = require('../../services/content-api');
const appData = require('../../modules/appData');
const { buildPagination } = require('../../modules/pagination');

function renderListing({
    res,
    title,
    entries = [],
    entriesMeta = null,
    breadcrumbs = [],
    isNewsLandingPage = false,
    copy
}) {
    const pagination = buildPagination(entriesMeta.pagination);
    const template = isNewsLandingPage ? 'landing' : 'listing';
    res.render(path.resolve(__dirname, `./views/${template}`), {
        title,
        entries,
        entriesMeta,
        pagination,
        breadcrumbs,
        isNewsLandingPage,
        copy
    });
}

function translateEntryTypeName(entry, copy) {
    const typeTranslation = get(copy.types, entry.updateType.slug);
    if (typeTranslation) {
        entry.updateType.name = typeTranslation;
    }
    return entry;
}

if (appData.isNotProduction) {
    router.get('/:type?/:date?/:slug?', injectBreadcrumbs, injectCopy('toplevel.news'), async (req, res, next) => {
        let urlPath = req.params.type ? `/${req.params.type}` : '';
        const isSinglePost = req.params.date && req.params.slug;

        if (isSinglePost) {
            // eg. fetch a specific entry
            urlPath += `/${req.params.date}/${req.params.slug}`;
        }

        // Listings (but not single posts) can be filtered by the following valid query parameters:
        let query = !isSinglePost ? pick(req.query, ['page', 'tag', 'author', 'category']) : {};

        try {
            const response = await getUpdates({
                locale: req.i18n.getLocale(),
                urlPath: urlPath,
                query: query
            });

            if (response.result) {
                // Do we have a listing page?
                if (isArray(response.result)) {
                    // Map and translate the entry type names into plurals
                    response.result = response.result.map(entry => translateEntryTypeName(entry, res.locals.copy));

                    // Is this a specific listing page (eg. blog, press releases) or everything?
                    const filterType = get(response, 'meta.pageType');
                    const isNewsLandingPage = !req.params.type && filterType === 'single';

                    // @TODO i18n
                    let defaultPageTitle = 'All news';
                    if (!isNewsLandingPage) {
                        const firstItem = head(response.result);
                        defaultPageTitle = get(firstItem.updateType.name, 'plural', firstItem.updateType.name);
                    }

                    const filterLabel = {
                        author: get(response, 'meta.activeAuthor'),
                        tag: get(response, 'meta.activeTag'),
                        category: get(response, 'meta.activeCategory')
                    }[filterType];

                    // @TODO i18n
                    const pageTitle = filterLabel
                        ? {
                              author: `Author: ${filterLabel.title}`,
                              tag: `Tag: ${filterLabel.title}`,
                              category: `Category: ${filterLabel.title}`
                          }[filterType]
                        : defaultPageTitle;

                    const breadcrumbs = concat(res.locals.breadcrumbs, {
                        label: filterLabel ? filterLabel.title : pageTitle
                    });

                    return renderListing({
                        res,
                        title: pageTitle,
                        entries: response.result,
                        entriesMeta: response.meta,
                        breadcrumbs: breadcrumbs,
                        isNewsLandingPage: isNewsLandingPage,
                        copy: res.locals.copy
                    });
                } else {
                    // Single entry page
                    if (req.baseUrl + req.path !== response.result.linkUrl) {
                        // Prevent URL tampering with dates, since we don't validate them on the API end
                        res.redirect(response.result.linkUrl);
                    } else {
                        const entry = translateEntryTypeName(response.result, res.locals.copy);
                        return res.render(path.resolve(__dirname, './views/post'), {
                            title: entry.title,
                            entry: entry,
                            copy: res.locals.copy,
                            breadcrumbs: concat(
                                res.locals.breadcrumbs,
                                {
                                    label: get(entry.updateType.name, 'singular', entry.updateType.name),
                                    url: res.locals.localify(`${req.baseUrl}/${req.params.type}`)
                                },
                                {
                                    label: entry.title
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
