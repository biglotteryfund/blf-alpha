'use strict';
const path = require('path');
const express = require('express');
const get = require('lodash/get');
const isArray = require('lodash/isArray');
const pick = require('lodash/pick');

const { buildArchiveUrl, localify } = require('../../common/urls');
const { injectHeroImage } = require('../../common/inject-content');
const contentApi = require('../../common/content-api');
const checkPreviewMode = require('../../common/check-preview-mode');

const router = express.Router();

const heroSlug = 'pawzitive-letterbox-new';

/**
 * News landing page handler
 */
router.get('/', injectHeroImage(heroSlug), async function (req, res, next) {
    try {
        /**
         * We make two requests here to ensure we get a distinct amount
         * of each content type (blogposts and people stories)
         * otherwise there may be zero entries of one kind
         * depending on frequency of posting of the other kind.
         */
        const [blogposts, peopleStories] = await Promise.all([
            await contentApi.getUpdates({
                locale: req.i18n.getLocale(),
                type: 'blog',
            }),
            await contentApi.getUpdates({
                locale: req.i18n.getLocale(),
                type: 'people-stories',
            }),
        ]);

        res.render(path.resolve(__dirname, `./views/landing`), {
            title: req.i18n.__('news.title'),
            blogposts: blogposts.result,
            peopleStories: peopleStories.result,
        });
    } catch (e) {
        next(e);
    }
});

function shouldRedirectLinkUrl(req, entry) {
    return (
        req.baseUrl + req.path !== entry.linkUrl &&
        checkPreviewMode(req.query).isPreview === false
    );
}

function renderPressListing(req, res, updatesResponse) {
    const finalPressReleaseArchiveDate = '20181001120823';
    const title = req.i18n.__('news.types.press-releases.plural');
    res.render(path.resolve(__dirname, './views/listing/press-releases'), {
        title: title,
        entries: updatesResponse.result,
        entriesMeta: updatesResponse.meta,
        pagination: updatesResponse.pagination,
        pressReleaseArchiveUrl: buildArchiveUrl(
            localify(req.i18n.getLocale())('/news-and-events'),
            finalPressReleaseArchiveDate
        ),
        breadcrumbs: res.locals.breadcrumbs.concat({ label: title }),
    });
}

function renderPressDetail(req, res, entry) {
    res.locals.isBilingual = entry.availableLanguages.length === 2;
    res.locals.openGraph = get(entry, 'openGraph', false);

    return res.render(path.resolve(__dirname, './views/post/press-release'), {
        title: entry.title,
        description: entry.summary,
        socialImage: get(entry, 'thumbnail.large', false),
        entry: entry,
        breadcrumbs: res.locals.breadcrumbs.concat([
            {
                label: req.i18n.__('news.types.press-releases.plural'),
                url: `${req.baseUrl}/press-releases`,
            },
            { label: entry.title },
        ]),
    });
}

/**
 * Press releases handler
 */
router.get(
    '/press-releases/:date?/:slug?',
    injectHeroImage(heroSlug),
    async function (req, res, next) {
        try {
            const updatesResponse = await contentApi.getUpdates({
                locale: req.i18n.getLocale(),
                type: 'press-releases',
                date: req.params.date,
                slug: req.params.slug,
                query: pick(req.query, ['page', 'region', 'social']),
                requestParams: req.query,
            });

            if (!updatesResponse.result) {
                next();
            } else if (isArray(updatesResponse.result)) {
                renderPressListing(req, res, updatesResponse);
            } else {
                const entry = updatesResponse.result;
                if (shouldRedirectLinkUrl(req, entry)) {
                    res.redirect(entry.linkUrl);
                } else if (entry.articleLink) {
                    res.redirect(entry.articleLink);
                } else if (entry.content.length > 0) {
                    renderPressDetail(req, res, entry);
                } else {
                    next();
                }
            }
        } catch (error) {
            if (error.statusCode >= 500) {
                next(error);
            } else {
                next();
            }
        }
    }
);

function renderUpdatesListing(req, res, updatesResponse) {
    const sectionTitle = req.i18n.__(
        `news.types.${req.params.updateType}.plural`
    );
    const crumbs = res.locals.breadcrumbs.concat({
        label: sectionTitle,
        url: `${req.baseUrl}/${req.params.updateType}`,
    });

    switch (updatesResponse.meta.pageType) {
        case 'tag':
            crumbs.push({
                label: `${req.i18n.__('news.filters.tag')}: ${
                    updatesResponse.meta.activeTag.title
                }`,
            });
            break;
        case 'category':
            crumbs.push({
                label: `${req.i18n.__('news.filters.category')}: ${
                    updatesResponse.meta.activeCategory.title
                }`,
            });
            break;
        case 'author':
            crumbs.push({
                label: `${req.i18n.__('news.filters.author')}: ${
                    updatesResponse.meta.activeAuthor.title
                }`,
            });
            break;
    }

    res.render(path.resolve(__dirname, './views/listing/blog'), {
        updateType: req.params.updateType,
        title: sectionTitle,
        entries: updatesResponse.result,
        entriesMeta: updatesResponse.meta,
        pagination: updatesResponse.pagination,
        breadcrumbs: crumbs,
    });
}

function renderUpdatesDetail(req, res, entry) {
    const entryTags = get(entry, 'tags', []);
    const entryTagList = entryTags.map(function (tag) {
        return {
            label: tag.title.toLowerCase(),
            url: localify(req.i18n.getLocale())(
                `/news/${req.params.updateType}?tag=${tag.slug}`
            ),
        };
    });

    res.render(path.resolve(__dirname, './views/post/blogpost'), {
        updateType: req.params.updateType,
        title: entry.title,
        isBilingual: entry.availableLanguages.length === 2,
        description: entry.summary,
        openGraph: get(entry, 'openGraph', false),
        socialImage: get(entry, 'thumbnail.large', false),
        entry: entry,
        entryTagList: entryTagList,
        breadcrumbs: res.locals.breadcrumbs.concat(
            {
                label: req.i18n.__(
                    `news.types.${req.params.updateType}.singular`
                ),
                url: `${req.baseUrl}/${req.params.updateType}`,
            },
            { label: entry.title }
        ),
    });
}

/**
 * Blog and People Story handler
 */
router.get(
    '/:updateType(blog|people-stories)/:date?/:slug?',
    injectHeroImage(heroSlug),
    async (req, res, next) => {
        try {
            const updatesResponse = await contentApi.getUpdates({
                locale: req.i18n.getLocale(),
                type: req.params.updateType,
                date: req.params.date,
                slug: req.params.slug,
                query: pick(req.query, [
                    'page',
                    'tag',
                    'author',
                    'category',
                    'region',
                    'social',
                ]),
                requestParams: req.query,
            });

            if (!updatesResponse.result) {
                next();
            } else if (isArray(updatesResponse.result)) {
                renderUpdatesListing(req, res, updatesResponse);
            } else {
                const entry = updatesResponse.result;
                if (shouldRedirectLinkUrl(req, entry)) {
                    res.redirect(entry.linkUrl);
                } else if (entry.content.length > 0) {
                    renderUpdatesDetail(req, res, entry);
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
