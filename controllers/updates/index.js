'use strict';
const path = require('path');
const express = require('express');
const { compact, concat, get, groupBy, head, includes, isArray, pick } = require('lodash');

const { buildPagination } = require('../../modules/pagination');
const { injectBreadcrumbs, injectCopy, injectHeroImage } = require('../../middleware/inject-content');
const appData = require('../../modules/appData');
const contentApi = require('../../services/content-api');

const router = express.Router();

function translateEntryFor(copy) {
    return function(entry) {
        const typeTranslation = get(copy.types, entry.updateType.slug);
        if (typeTranslation) {
            entry.updateType.name = typeTranslation;
        }
        return entry;
    };
}

if (appData.isNotProduction) {
    router.get(
        '/press-releases/:date?/:slug?',
        injectBreadcrumbs,
        injectCopy('news'),
        injectHeroImage('youth-action-1'),
        async (req, res, next) => {
            try {
                const { breadcrumbs, copy } = res.locals;
                const typeCopy = copy.types['press-releases'];

                const response = await contentApi.getUpdates({
                    locale: req.i18n.getLocale(),
                    type: 'press-releases',
                    date: req.params.date,
                    slug: req.params.slug,
                    query: pick(req.query, ['page', 'region'])
                });

                if (!response.result) {
                    next();
                }

                if (isArray(response.result)) {
                    res.render(path.resolve(__dirname, './views/listing/press-releases'), {
                        title: typeCopy.plural,
                        entries: response.result,
                        entriesMeta: response.meta,
                        pagination: buildPagination(response.meta.pagination),
                        breadcrumbs: concat(breadcrumbs, { label: typeCopy.plural })
                    });
                } else {
                    if (req.baseUrl + req.path !== response.result.linkUrl) {
                        res.redirect(response.result.linkUrl);
                    } else {
                        const entry = response.result;
                        return res.render(path.resolve(__dirname, './views/post/press-release'), {
                            title: entry.title,
                            entry: entry,
                            breadcrumbs: concat(
                                res.locals.breadcrumbs,
                                {
                                    label: typeCopy.singular,
                                    url: res.locals.localify(`${req.baseUrl}/press-releases`)
                                },
                                { label: entry.title }
                            )
                        });
                    }
                }
            } catch (e) {
                next(e);
            }
        }
    );

    router.get(
        '/:type?/:date?/:slug?',
        injectBreadcrumbs,
        injectCopy('news'),
        injectHeroImage('manchester-cares'),
        async (req, res, next) => {
            // Redirect invalid update types
            if (req.params.type && includes(['blog', 'press-releases', 'updates'], req.params.type) === false) {
                return res.redirect(req.baseUrl);
            }

            try {
                const urlParts = compact([req.params.type, req.params.date, req.params.slug]);

                const response = await contentApi.getUpdates({
                    locale: req.i18n.getLocale(),
                    urlPath: `/${urlParts.join('/')}`,
                    // Listings (but not single posts) can be filtered by the following valid query parameters:
                    query: urlParts.length === 3 ? {} : pick(req.query, ['page', 'tag', 'author', 'category', 'region'])
                });

                if (!response.result) {
                    next();
                }

                const entryWithTranslation = translateEntryFor(res.locals.copy);

                if (isArray(response.result)) {
                    // Map and translate the entry type names into plurals
                    const entries = response.result.map(entryWithTranslation);

                    const entriesMeta = response.meta;
                    const filterType = get(entriesMeta, 'pageType');
                    const pagination = buildPagination(entriesMeta.pagination);

                    if (filterType === 'single' && !req.params.type) {
                        const pageTitle = res.locals.copy.allNews;
                        const groupedEntries = groupBy(entries, 'entryType');

                        /**
                         * Render landing page
                         */
                        res.render(path.resolve(__dirname, `./views/landing`), {
                            title: pageTitle,
                            groupedEntries: groupedEntries,
                            pagination: pagination,
                            breadcrumbs: concat(res.locals.breadcrumbs, {
                                label: pageTitle
                            })
                        });
                    } else {
                        const filterLabel = {
                            author: get(response, 'meta.activeAuthor'),
                            tag: get(response, 'meta.activeTag'),
                            category: get(response, 'meta.activeCategory'),
                            region: get(response, 'meta.activeRegion')
                        }[filterType];

                        // @TODO i18n
                        const titleMap = {
                            author: function() {
                                return `Showing posts by ${filterLabel.title}`;
                            },
                            tag: function() {
                                return `Showing posts tagged ${filterLabel.title}`;
                            },
                            category: function() {
                                return `Showing posts in ${filterLabel.title}`;
                            },
                            region: function() {
                                return `Showing posts from ${filterLabel.title}`;
                            },
                            default: function() {
                                const firstItem = head(entries);
                                return get(firstItem.updateType.name, 'plural', firstItem.updateType.name);
                            }
                        };

                        const pageTitle = (titleMap[filterType] || titleMap['default'])();

                        const templatePath = {
                            blog: './views/listing/blog',
                            'press-releases': './views/listing/press-releases',
                            updates: './views/listing/generic'
                        }[req.params.type || 'updates'];

                        /**
                         * Render listing page
                         */
                        res.render(path.resolve(__dirname, templatePath), {
                            title: pageTitle,
                            entries: entries,
                            entriesMeta: entriesMeta,
                            pagination: pagination,
                            breadcrumbs: concat(res.locals.breadcrumbs, {
                                label: filterLabel ? filterLabel.title : pageTitle
                            })
                        });
                    }
                } else {
                    // Prevent URL tampering with dates, since we don't validate them on the API end
                    if (req.baseUrl + req.path !== response.result.linkUrl) {
                        res.redirect(response.result.linkUrl);
                    } else {
                        const entry = entryWithTranslation(response.result);
                        const title = entry.title;

                        const breadcrumbs = concat(
                            res.locals.breadcrumbs,
                            {
                                label: get(entry.updateType.name, 'plural', entry.updateType.name),
                                url: res.locals.localify(`${req.baseUrl}/${req.params.type}`)
                            },
                            { label: title }
                        );

                        const templatePath = {
                            blog: './views/post/blogpost',
                            'press-releases': './views/listing/generic',
                            updates: './views/listing/generic'
                        }[req.params.type || 'updates'];

                        /**
                         * Render single entry page
                         */
                        return res.render(path.resolve(__dirname, templatePath), { title, entry, breadcrumbs });
                    }
                }
            } catch (e) {
                next(e);
            }
        }
    );
}

module.exports = router;
