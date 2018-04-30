'use strict';
const Raven = require('raven');
const { get } = require('lodash/fp');
const contentApi = require('../services/content-api');
const { defaultHeroImage } = require('../modules/images');

module.exports = function injectHeroImage(page) {
    const heroSlug = get('heroSlug')(page);
    return function(req, res, next) {
        if (heroSlug) {
            contentApi
                .getHeroImage({
                    locale: req.i18n.getLocale(),
                    slug: heroSlug
                })
                .then(heroImage => {
                    res.locals.heroImage = heroImage;
                    next();
                })
                .catch(err => {
                    Raven.captureException(err);
                    res.locals.heroImage = defaultHeroImage;
                    next();
                });
        } else {
            res.locals.heroImage = defaultHeroImage;
            next();
        }
    };
};
