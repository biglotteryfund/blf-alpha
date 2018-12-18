'use strict';
const Raven = require('raven');
const path = require('path');
const express = require('express');
const contentApi = require('../../services/content-api');

const router = express.Router();

async function injectPromotedUpdates(req, res, next) {
    try {
        res.locals.promotedUpdates = await contentApi.getUpdates({
            locale: req.i18n.getLocale(),
            query: {
                promoted: true
            }
        });
        next();
    } catch (error) {
        res.locals.promotedUpdates = [];
        Raven.captureException(error);
        next();
    }
}

async function injectHeroImages(req, res, next) {
    try {
        const response = await contentApi.getHomepage({ locale: req.i18n.getLocale() });
        res.locals.heroImages = response.heroImages;
        next();
    } catch (error) {
        res.locals.heroImages = {
            small: '/assets/images/hero/superhero-fallback-small.jpg',
            medium: '/assets/images/hero/superhero-fallback-medium.jpg',
            large: '/assets/images/hero/superhero-fallback-large.jpg',
            default: '/assets/images/hero/superhero-fallback-medium.jpg',
            caption: 'Stepping Stones Programme, Grant £405,270'
        };
        Raven.captureException(error);
        next();
    }
}

router.get('/', injectPromotedUpdates, injectHeroImages, async (req, res) => {
    if (res.locals.useNewBrand) {
        res.render(path.resolve(__dirname, './views/home-rebrand'), {
            heroImage: {
                small: '/assets/images/hero/superhero-small.jpg',
                medium: '/assets/images/hero/superhero-medium.jpg',
                large: '/assets/images/hero/superhero-large.jpg',
                default: '/assets/images/hero/superhero-medium.jpg',
                caption: 'Connect Community Trust'
            }
        });
    } else {
        res.render(path.resolve(__dirname, './views/home'));
    }
});

module.exports = router;
