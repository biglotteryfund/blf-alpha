const Raven = require('raven');
const contentApi = require('../../services/content-api');
const images = require('../../modules/images');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, (req, res) => {
        const locale = req.i18n.getLocale();

        const serveHomepage = (heroImages, newsArticles) => {
            const lang = req.i18n.__('toplevel.home');

            res.render('pages/toplevel/home', {
                copy: lang,
                title: lang.title,
                description: lang.description || false,
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
                const fallbackHeroes = {
                    default: images.heroImages.larcheBelfast,
                    candidates: [
                        images.heroImages.passion4Fusion,
                        images.heroImages.streetDreams
                    ]
                };
                serveHomepage(fallbackHeroes);
            });
    });
}

module.exports = {
    init
};
