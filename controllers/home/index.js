'use strict';
const path = require('path');
const express = require('express');
const contentApi = require('../../services/content-api');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const { featuredLinks, promotedUpdates } = await contentApi.getHomepage({
            locale: req.i18n.getLocale()
        });

        res.render(path.resolve(__dirname, './views/home'), {
            featuredLinks,
            promotedUpdates,
            heroImage: {
                small: '/assets/images/home/superhero-small.jpg',
                medium: '/assets/images/home/superhero-medium.jpg',
                large: '/assets/images/home/superhero-large.jpg',
                default: '/assets/images/home/superhero-medium.jpg',
                caption: 'Superstars Club'
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
