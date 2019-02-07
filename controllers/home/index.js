'use strict';
const Raven = require('raven');
const path = require('path');
const express = require('express');
const contentApi = require('../../services/content-api');

const router = express.Router();

const injectHomepage = async (req, res, next) => {
    res.locals.homepageContent = await contentApi.getHomepage({
        locale: req.i18n.getLocale()
    });
    next();
};

router.get('/', injectHomepage, async (req, res) => {
    let promotedUpdates;
    try {
        promotedUpdates = await contentApi.getUpdates({
            locale: req.i18n.getLocale(),
            query: {
                promoted: true
            }
        });
    } catch (error) {
        Raven.captureException(error);
    }

    res.render(path.resolve(__dirname, './views/home'), {
        promotedUpdates: promotedUpdates,
        heroImage: {
            small: '/assets/images/home/superhero-small.jpg',
            medium: '/assets/images/home/superhero-medium.jpg',
            large: '/assets/images/home/superhero-large.jpg',
            default: '/assets/images/home/superhero-medium.jpg',
            caption: 'Superstars Club'
        }
    });
});

module.exports = router;
