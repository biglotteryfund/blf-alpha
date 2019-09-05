'use strict';
const path = require('path');
const express = require('express');
const { concat, isArray, pick, get } = require('lodash');

const { buildPagination } = require('../../common/pagination');
const { buildArchiveUrl } = require('../../common/archived');
const { localify } = require('../../common/urls');
const {
    injectBreadcrumbs,
    injectCopy,
    injectHeroImage
} = require('../../common/inject-content');
const contentApi = require('../../common/content-api');

const router = express.Router();

const heroSlug = 'pawzitive-letterbox-new';

/**
 * News landing page handler
 */
router.get(
    '/',
    injectBreadcrumbs,
    injectCopy('news'),
    injectHeroImage(heroSlug),
    async (req, res, next) => {
        try {
            const { copy, breadcrumbs } = res.locals;

            // We make two requests here to ensure we get a distinct amount
            // of each content type (blogposts and people stories)
            // otherwise there may be zero entries of one kind
            // depending on frequency of posting of the other kind.

            const blogposts = await contentApi.getUpdates({
                locale: req.i18n.getLocale(),
                type: 'blog'
            });

            const peopleStories = await contentApi.getUpdates({
                locale: req.i18n.getLocale(),
                type: 'people-stories'
            });

            res.render(path.resolve(__dirname, `./views/landing`), {
                title: copy.title,
                blogposts: blogposts.result,
                peopleStories: peopleStories.result,
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
                query: pick(req.query, ['page', 'region', 'social']),
                previewMode: res.locals.PREVIEW_MODE || false
            });

            if (!response.result) {
                next();
            }

            if (isArray(response.result)) {
                const finalPressReleaseArchiveDate = '20181001120823';
                res.render(
                    path.resolve(__dirname, './views/listing/press-releases'),
                    {
                        title: typeCopy.plural,
                        entries: response.result,
                        entriesMeta: response.meta,
                        pagination: buildPagination(
                            response.meta.pagination,
                            req.query
                        ),
                        pressReleaseArchiveUrl: buildArchiveUrl(
                            localify(req.i18n.getLocale())('/news-and-events'),
                            finalPressReleaseArchiveDate
                        ),
                        breadcrumbs: concat(breadcrumbs, {
                            label: typeCopy.plural
                        })
                    }
                );
            } else {
                const entry = response.result;
                if (
                    req.baseUrl + req.path !== entry.linkUrl &&
                    !res.locals.PREVIEW_MODE
                ) {
                    res.redirect(entry.linkUrl);
                } else if (entry.articleLink) {
                    res.redirect(entry.articleLink);
                } else if (entry.content.length > 0) {
                    res.locals.isBilingual =
                        entry.availableLanguages.length === 2;
                    res.locals.openGraph = get(entry, 'openGraph', false);

                    return res.render(
                        path.resolve(__dirname, './views/post/press-release'),
                        {
                            title: entry.title,
                            description: entry.summary,
                            socialImage: get(entry, 'thumbnail.large', false),
                            entry: entry,
                            breadcrumbs: concat(
                                res.locals.breadcrumbs,
                                {
                                    label: typeCopy.plural,
                                    url: res.locals.localify(
                                        `${req.baseUrl}/press-releases`
                                    )
                                },
                                { label: entry.title }
                            )
                        }
                    );
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
 * Blog and People Story handler
 */
router.get(
    '/:updateType(blog|people-stories)/:date?/:slug?',
    injectBreadcrumbs,
    injectCopy('news'),
    injectHeroImage(heroSlug),
    async (req, res, next) => {
        try {
            const { copy } = res.locals;
            const updateType = req.params.updateType;
            const typeCopy = copy.types[updateType];

            const response = await contentApi.getUpdates({
                locale: req.i18n.getLocale(),
                type: updateType,
                date: req.params.date,
                slug: req.params.slug,
                query: pick(req.query, [
                    'page',
                    'tag',
                    'author',
                    'category',
                    'region',
                    'social'
                ]),
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
                    url: res.locals.localify(`${req.baseUrl}/${updateType}`)
                });
                const crumbName = getCrumbName(response.meta);
                if (crumbName) {
                    crumbs = concat(crumbs, { label: crumbName });
                }

                res.render(path.resolve(__dirname, './views/listing/blog'), {
                    updateType: updateType,
                    title: typeCopy.plural,
                    entries: response.result,
                    entriesMeta: response.meta,
                    pagination: buildPagination(
                        response.meta.pagination,
                        req.query
                    ),
                    breadcrumbs: crumbs
                });
            } else {
                const entry = response.result;
                if (
                    req.baseUrl + req.path !== entry.linkUrl &&
                    !res.locals.PREVIEW_MODE
                ) {
                    res.redirect(entry.linkUrl);
                } else if (entry.content.length > 0) {
                    res.locals.isBilingual =
                        entry.availableLanguages.length === 2;
                    res.locals.openGraph = get(entry, 'openGraph', false);

                    return res.render(
                        path.resolve(__dirname, './views/post/blogpost'),
                        {
                            updateType: updateType,
                            title: entry.title,
                            description: entry.summary,
                            socialImage: get(entry, 'thumbnail.large', false),
                            entry: entry,
                            breadcrumbs: concat(
                                res.locals.breadcrumbs,
                                {
                                    label: typeCopy.singular,
                                    url: res.locals.localify(
                                        `${req.baseUrl}/${updateType}`
                                    )
                                },
                                { label: entry.title }
                            )
                        }
                    );
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
