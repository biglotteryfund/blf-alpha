'use strict';
const { get } = require('lodash');
const Raven = require('raven');
const path = require('path');
const express = require('express');
const contentApi = require('../../services/content-api');

const router = express.Router();

async function injectHomepageContent(req, res, next) {
    try {
        const response = await contentApi.getHomepage({ locale: req.i18n.getLocale() });
        res.locals.heroImages = response.heroImages;
        res.locals.newsArticles = response.newsArticles;
        next();
    } catch (error) {
        Raven.captureException(error);
        next();
    }
}

router.get('/', injectHomepageContent, (req, res) => {
    const fallbackSuperheroImage = {
        default: {
            small: '/assets/images/hero/superhero-fallback-small.jpg',
            medium: '/assets/images/hero/superhero-fallback-medium.jpg',
            large: '/assets/images/hero/superhero-fallback-large.jpg',
            default: '/assets/images/hero/superhero-fallback-medium.jpg',
            caption: 'Stepping Stones Programme, Grant £405,270'
        }
    };

    res.render(path.resolve(__dirname, './views/home'), {
        news: get(res.locals, 'newsArticles', []),
        heroImage: get(res.locals, 'heroImages', fallbackSuperheroImage)
    });
});

module.exports = router;
