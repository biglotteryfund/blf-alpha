'use strict';
const path = require('path');
const express = require('express');
const { concat, groupBy, isArray, pick, get } = require('lodash');

const { buildPagination } = require('../../modules/pagination');
const { injectBreadcrumbs, injectCopy, injectHeroImage } = require('../../middleware/inject-content');
const appData = require('../../modules/appData');
const contentApi = require('../../services/content-api');

const router = express.Router();

if (appData.isNotProduction) {
    /**
     * News landing page handler
     */
    router.get(
        '/',
        injectBreadcrumbs,
        injectCopy('news'),
        injectHeroImage('mental-health-foundation'),
        async (req, res, next) => {
            try {
                const { copy, breadcrumbs } = res.locals;

                const pressReleases = await contentApi.getUpdates({
                    locale: req.i18n.getLocale(),
                    type: 'press-releases'
                });

                const blogposts = await contentApi.getUpdates({
                    locale: req.i18n.getLocale(),
                    type: 'blog'
                });

                const allEntries = concat(pressReleases.result, blogposts.result);

                res.render(path.resolve(__dirname, `./views/landing`), {
                    title: copy.title,
                    groupedEntries: groupBy(allEntries, 'entryType'),
                    breadcrumbs: concat(breadcrumbs, { label: copy.title })
                });
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * Press releases handler
     */
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
                    const entry = response.result;
                    if (req.baseUrl + req.path !== entry.linkUrl) {
                        res.redirect(entry.linkUrl);
                    } else if (entry.articleLink) {
                        res.redirect(entry.articleLink);
                    } else if (entry.content.length > 0) {
                        res.locals.isBilingual = entry.availableLanguages.length === 2;
                        return res.render(path.resolve(__dirname, './views/post/press-release'), {
                            title: entry.title,
                            description: entry.summary,
                            socialImage: get(entry, 'thumbnail.large', false),
                            entry: entry,
                            breadcrumbs: concat(
                                res.locals.breadcrumbs,
                                {
                                    label: typeCopy.plural,
                                    url: res.locals.localify(`${req.baseUrl}/press-releases`)
                                },
                                { label: entry.title }
                            )
                        });
                    } else {
                        next();
                    }
                }
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * Blog handler
     */
    router.get(
        '/blog/:date?/:slug?',
        injectBreadcrumbs,
        injectCopy('news'),
        injectHeroImage('manchester-cares'),
        async (req, res, next) => {
            try {
                const { breadcrumbs, copy } = res.locals;
                const typeCopy = copy.types.blog;

                const response = await contentApi.getUpdates({
                    locale: req.i18n.getLocale(),
                    type: 'blog',
                    date: req.params.date,
                    slug: req.params.slug,
                    query: pick(req.query, ['page', 'tag', 'author', 'category', 'region'])
                });

                if (!response.result) {
                    next();
                }

                if (isArray(response.result)) {
                    const getCrumbName = entriesMeta => {
                        let title;
                        switch (entriesMeta.pageType) {
                            case 'tag':
                                title = `${copy.filters.tag}: ${entriesMeta.activeTag.title}`;
                                break;
                            case 'category':
                                title = `${copy.filters.category}: ${entriesMeta.activeCategory.title}`;
                                break;
                            case 'author':
                                title = `${copy.filters.author}: ${entriesMeta.activeAuthor.title}`;
                                break;
                        }
                        return title;
                    };

                    let crumbs = concat(res.locals.breadcrumbs, {
                        label: typeCopy.plural,
                        url: res.locals.localify(`${req.baseUrl}/blog`)
                    });
                    const crumbName = getCrumbName(response.meta);
                    if (crumbName) {
                        crumbs = concat(crumbs, { label: crumbName });
                    }

                    res.render(path.resolve(__dirname, './views/listing/blog'), {
                        title: typeCopy.plural,
                        entries: response.result,
                        entriesMeta: response.meta,
                        pagination: buildPagination(response.meta.pagination),
                        breadcrumbs: crumbs
                    });
                } else {
                    const entry = response.result;
                    if (req.baseUrl + req.path !== entry.linkUrl) {
                        res.redirect(entry.linkUrl);
                    } else if (entry.content.length > 0) {
                        res.locals.isBilingual = entry.availableLanguages.length === 2;
                        return res.render(path.resolve(__dirname, './views/post/blogpost'), {
                            title: entry.title,
                            description: entry.summary,
                            socialImage: get(entry, 'thumbnail.large', false),
                            entry: entry,
                            breadcrumbs: concat(
                                res.locals.breadcrumbs,
                                {
                                    label: typeCopy.singular,
                                    url: res.locals.localify(`${req.baseUrl}/blog`)
                                },
                                { label: entry.title }
                            )
                        });
                    } else {
                        next();
                    }
                }
            } catch (e) {
                next(e);
            }
        }
    );
}

module.exports = router;
