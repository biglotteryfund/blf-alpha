'use strict';
const path = require('path');
const express = require('express');
const { compact, concat, get, groupBy, head, isArray, pick } = require('lodash');

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
        '/:type?/:date?/:slug?',
        injectBreadcrumbs,
        injectCopy('toplevel.news'),
        injectHeroImage('manchester-cares'),
        async (req, res, next) => {
            // Redirect invalid update types
            const validUpdateTypes = ['blog', 'press-releases', 'updates'];
            if (req.params.type && validUpdateTypes.indexOf(req.params.type) === -1) {
                return res.redirect('/news');
            }

            try {
                const urlParts = compact([req.params.type, req.params.date, req.params.slug]);

                const response = await contentApi.getUpdates({
                    locale: req.i18n.getLocale(),
                    urlPath: `/${urlParts.join('/')}`,
                    // Listings (but not single posts) can be filtered by the following valid query parameters:
                    query: urlParts.length === 3 ? {} : pick(req.query, ['page', 'tag', 'author', 'category'])
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
                            category: get(response, 'meta.activeCategory')
                        }[filterType];

                        // @TODO i18n
                        const titleMap = {
                            author: function() {
                                return `Author: ${filterLabel.title}`;
                            },
                            tag: function() {
                                return `Tag: ${filterLabel.title}`;
                            },
                            category: function() {
                                return `Category: ${filterLabel.title}`;
                            },
                            default: function() {
                                const firstItem = head(entries);
                                return get(firstItem.updateType.name, 'plural', firstItem.updateType.name);
                            }
                        };

                        const pageTitle = (titleMap[filterType] || titleMap['default'])();
                        const templatePath = {
                            blog: './views/listing/blog',
                            'press-releases': './views/listing/generic',
                            updates: './views/listing/generic'
                        }[req.params.type || 'updates'];

                        /**
                         * Render listing page
                         */
                        res.render(path.resolve(__dirname, templatePath), {
                            listingType: req.params.type,
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

                        /**
                         * Render single entry page
                         */
                        return res.render(path.resolve(__dirname, './views/post'), { title, entry, breadcrumbs });
                    }
                }
            } catch (e) {
                next(e);
            }
        }
    );
}

module.exports = router;
