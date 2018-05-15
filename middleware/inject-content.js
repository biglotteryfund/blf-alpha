'use strict';
const Raven = require('raven');
const { flatten, get, getOr } = require('lodash/fp');

const { defaultHeroImage } = require('../modules/images');
const { localify, removeWelsh } = require('../modules/urls');
const contentApi = require('../services/content-api');

function injectHeroImage(page) {
    const heroSlug = get('heroSlug')(page);
    return async function(req, res, next) {
        if (!heroSlug) {
            return next();
        }

        // Set defaults
        res.locals.heroImage = defaultHeroImage;
        res.locals.socialImage = defaultHeroImage;

        res.locals.timings.start('inject-hero');

        try {
            const heroImage = await contentApi.getHeroImage({
                locale: req.i18n.getLocale(),
                slug: heroSlug
            });

            res.locals.timings.end('inject-hero');
            res.locals.heroImage = heroImage;
            res.locals.socialImage = heroImage;
            next();
        } catch (error) {
            Raven.captureException(error);
            next();
        }
    };
}

function injectCopy(page) {
    return function(req, res, next) {
        if (page.lang) {
            const copy = req.i18n.__(page.lang);
            res.locals.copy = copy;
            res.locals.title = copy.title;
            res.locals.description = copy.description || false;
        }

        next();
    };
}

function injectBreadcrumbs(req, res, next) {
    const locale = req.i18n.getLocale();
    const copy = res.locals.copy;
    const content = res.locals.content;

    const sectionSlug = removeWelsh(req.baseUrl).replace(/^\/+/g, '');
    const sectionLabel = req.i18n.__(`global.nav.${sectionSlug}`);

    if (sectionLabel) {
        const topLevelCrumb = {
            label: sectionLabel,
            url: localify(locale)(req.baseUrl)
        };

        const ancestors = getOr([], 'ancestors')(content);
        const ancestorCrumbs = ancestors.map(ancestor => ({
            label: ancestor.title,
            url: localify(locale)(`/${ancestor.path}`)
        }));

        const getTitle = get('title');
        const currentCrumb = {
            label: getTitle(content) || getTitle(copy)
        };

        res.locals.breadcrumbs = flatten([topLevelCrumb, ancestorCrumbs, currentCrumb]);
    }

    next();
}

async function injectListingContent(req, res, next) {
    try {
        res.locals.timings.start('inject-content');
        const content = await contentApi.getListingPage({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            previewMode: res.locals.PREVIEW_MODE || false
        });

        if (content) {
            res.locals.content = content;
        }

        res.locals.timings.end('inject-content');
        next();
    } catch (error) {
        next(error);
    }
}

async function injectBlogPosts(req, res, next) {
    try {
        const result = await contentApi.getBlogPosts({
            locale: req.i18n.getLocale(),
            page: req.query.page || 1
        });

        res.locals.blogPosts = result;
        next();
    } catch (error) {
        next();
    }
}

async function injectBlogDetail(req, res, next) {
    try {
        const [response, result] = await contentApi.getBlogDetail({
            locale: req.i18n.getLocale(),
            urlPath: req.path
        });

        console.log(result);
        res.locals.blogDetail = {
            meta: response.meta,
            result: result
        };
        next();
    } catch (error) {
        next();
    }
}

function injectProfiles(section) {
    return async function(req, res, next) {
        try {
            const profiles = await contentApi.getProfiles({
                locale: req.i18n.getLocale(),
                section: section
            });

            res.locals.profiles = profiles;
            next();
        } catch (error) {
            Raven.captureException(error);
            next();
        }
    };
}

module.exports = {
    injectBlogDetail,
    injectBlogPosts,
    injectBreadcrumbs,
    injectCopy,
    injectHeroImage,
    injectListingContent,
    injectProfiles
};
