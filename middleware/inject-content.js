'use strict';
const Raven = require('raven');
const { get } = require('lodash/fp');

const { defaultHeroImage } = require('../modules/images');
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

async function injectListingContent(req, res, next) {
    try {
        res.locals.timings.start('inject-content');
        const content = await contentApi.getListingPage({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            previewMode: res.locals.PREVIEW_MODE || false
        });
        res.locals.content = content;
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
