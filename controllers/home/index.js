'use strict';
const path = require('path');
const express = require('express');
const contentApi = require('../../common/content-api');

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
                small: '/assets/images/home/superhero-small-v2.jpg',
                medium: '/assets/images/home/superhero-medium-v2.jpg',
                large: '/assets/images/home/superhero-large-v2.jpg',
                default: '/assets/images/home/superhero-medium-v2.jpg',
                caption: 'Superstars Club'
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
