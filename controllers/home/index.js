'use strict';
const path = require('path');
const express = require('express');

const contentApi = require('../../common/content-api');

const router = express.Router();

router.get('/', async function (req, res, next) {
    try {
        const entry = await contentApi.getHomepage(
            req.i18n.getLocale(),
            req.query
        );

        res.render(path.resolve(__dirname, './views/home'), {
            showCOVID19AnnouncementBanner: false,
            content: entry.content,
            featuredLinks: entry.featuredLinks,
            promotedUpdates: entry.promotedUpdates,
            heroImage: {
                small: '/assets/images/home/superhero-shallow-small.jpg',
                medium: '/assets/images/home/superhero-shallow-medium.jpg',
                large: '/assets/images/home/superhero-shallow-large.jpg',
                default: '/assets/images/home/superhero-shallow-medium.jpg',
                caption: 'Superstars Club',
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
