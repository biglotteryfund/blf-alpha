'use strict';
const { get } = require('lodash');
const Raven = require('raven');
const { heroImages } = require('../../modules/images');
const { injectCopy } = require('../../middleware/inject-content');
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
    router.get(routeConfig.path, injectCopy(routeConfig), injectHomepageContent, (req, res) => {
        res.render(routeConfig.template, {
            news: get(res.locals, 'newsArticles', []),
            heroImage: get(res.locals, 'heroImages', heroImages.fallbackSuperheroImage)
        });
    });
}

module.exports = {
    init
};
