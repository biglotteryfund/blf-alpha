'use strict';
const Raven = require('raven');
const contentApi = require('../../services/content-api');
const { superHeroImages } = require('../../modules/images');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, (req, res) => {
        const locale = req.i18n.getLocale();

        const serveHomepage = (heroImages, newsArticles) => {
            const copy = req.i18n.__('toplevel.home');

            res.render('pages/toplevel/home', {
                copy: copy,
                title: copy.title,
                description: copy.description || false,
                news: newsArticles || [],
                heroImage: heroImages || null
            });
        };

        contentApi
            .getHomepage({ locale })
            .then(response => {
                const { heroImages, newsArticles } = response;
                serveHomepage(heroImages, newsArticles);
            })
            .catch(err => {
                Raven.captureException(err);
                serveHomepage({
                    default: superHeroImages.steppingStones,
                    candidates: []
                });
            });
    });
}

module.exports = {
    init
};
