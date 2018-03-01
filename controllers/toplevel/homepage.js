const { homepageHero } = require('../../modules/images');
const contentApi = require('../../services/content-api');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, (req, res) => {
        const serveHomepage = news => {
            const lang = req.i18n.__('toplevel.home');

            res.render('pages/toplevel/home', {
                title: lang.title,
                description: lang.description || false,
                copy: lang,
                news: news || [],
                heroImage: homepageHero
            });
        };

        contentApi
            .getPromotedNews({
                locale: req.i18n.getLocale(),
                limit: 3
            })
            .then(entries => {
                serveHomepage(entries);
            })
            .catch(() => {
                serveHomepage();
            });
    });
}

module.exports = {
    init
};
