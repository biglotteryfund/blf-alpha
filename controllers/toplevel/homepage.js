'use strict';
const { get } = require('lodash');
const Raven = require('raven');
const contentApi = require('../../services/content-api');

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

function init({ router, routeConfig }) {
    router.get(routeConfig.path, injectHomepageContent, (req, res) => {
        const fallbackSuperheroImage = {
            small: '/assets/images/hero/superhero-fallback-small.jpg',
            medium: '/assets/images/hero/superhero-fallback-medium.jpg',
            large: '/assets/images/hero/superhero-fallback-large.jpg',
            default: '/assets/images/hero/superhero-fallback-medium.jpg',
            caption: 'Stepping Stones Programme, Grant £405,270'
        };

        res.render(routeConfig.template, {
            news: get(res.locals, 'newsArticles', []),
            heroImage: get(res.locals, 'heroImages', fallbackSuperheroImage)
        });
    });
}

module.exports = {
    init
};
