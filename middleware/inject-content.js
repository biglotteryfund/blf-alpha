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

function buildContentBreadcrumbs(req, res) {
    const locale = req.i18n.getLocale();
    const content = res.locals.content;
    const ancestors = getOr([], 'ancestors')(content);
    const sectionSlug = removeWelsh(req.baseUrl).replace(/^\/+/g, '');

    const topLevelCrumb = {
        label: req.i18n.__(`global.nav.${sectionSlug}`),
        url: localify(locale)(req.baseUrl)
    };

    const ancestorCrumbs = ancestors.map(ancestor => ({
        label: ancestor.title,
        url: localify(locale)(`/${ancestor.path}`)
    }));

    const currentCrumb = {
        label: content.title
    };

    return flatten([topLevelCrumb, ancestorCrumbs, currentCrumb]);
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
            res.locals.breadcrumbs = buildContentBreadcrumbs(req, res);
        }

        res.locals.timings.end('inject-content');
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    injectHeroImage,
    injectListingContent
};
