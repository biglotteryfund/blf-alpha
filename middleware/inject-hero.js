'use strict';
const Raven = require('raven');
const { get } = require('lodash/fp');
const contentApi = require('../services/content-api');
const { defaultHeroImage } = require('../modules/images');

module.exports = function injectHeroImage(page) {
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
};
