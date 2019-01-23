'use strict';
const path = require('path');
const express = require('express');
const { concat, isArray, pick, get } = require('lodash');

const { buildPagination } = require('../../modules/pagination');
const { buildArchiveUrl } = require('../../modules/archived');
const { localify } = require('../../modules/urls');
const { injectBreadcrumbs, injectCopy, injectHeroImage } = require('../../middleware/inject-content');
const contentApi = require('../../services/content-api');

const router = express.Router();

const heroSlug = 'glasgow-gladiators-1';

/**
 * News landing page handler
 */
router.get('/', injectBreadcrumbs, injectCopy('news'), injectHeroImage(heroSlug), async (req, res, next) => {
    try {
        const { copy, breadcrumbs } = res.locals;

        const blogposts = await contentApi.getUpdates({
            locale: req.i18n.getLocale(),
            type: 'blog'
        });

        res.render(path.resolve(__dirname, `./views/landing`), {
            title: copy.title,
            blogposts: blogposts.result,
            breadcrumbs: concat(breadcrumbs, { label: copy.title })
        });
    } catch (e) {
        next(e);
    }
});

/**
 * Press releases handler
 */
router.get(
    '/press-releases/:date?/:slug?',
    injectBreadcrumbs,
    injectCopy('news'),
    injectHeroImage(heroSlug),
    async (req, res, next) => {
        try {
            const { breadcrumbs, copy } = res.locals;
            const typeCopy = copy.types['press-releases'];

            const response = await contentApi.getUpdates({
                locale: req.i18n.getLocale(),
                type: 'press-releases',
                date: req.params.date,
                slug: req.params.slug,
                query: pick(req.query, ['page', 'region']),
                previewMode: res.locals.PREVIEW_MODE || false
            });

            if (!response.result) {
                next();
            }

            if (isArray(response.result)) {
                const finalPressReleaseArchiveDate = '20181001120823';
                res.render(path.resolve(__dirname, './views/listing/press-releases'), {
                    title: typeCopy.plural,
                    entries: response.result,
                    entriesMeta: response.meta,
                    pagination: buildPagination(response.meta.pagination),
                    pressReleaseArchiveUrl: buildArchiveUrl(
                        localify(req.i18n.getLocale())('/news-and-events'),
                        finalPressReleaseArchiveDate
                    ),
                    breadcrumbs: concat(breadcrumbs, { label: typeCopy.plural })
                });
            } else {
                const entry = response.result;
                if (req.baseUrl + req.path !== entry.linkUrl && !res.locals.PREVIEW_MODE) {
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
    injectHeroImage(heroSlug),
    async (req, res, next) => {
        try {
            const { copy } = res.locals;
            const typeCopy = copy.types.blog;

            const response = await contentApi.getUpdates({
                locale: req.i18n.getLocale(),
                type: 'blog',
                date: req.params.date,
                slug: req.params.slug,
                query: pick(req.query, ['page', 'tag', 'author', 'category', 'region']),
                previewMode: res.locals.PREVIEW_MODE || false
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
                if (req.baseUrl + req.path !== entry.linkUrl && !res.locals.PREVIEW_MODE) {
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

module.exports = router;
