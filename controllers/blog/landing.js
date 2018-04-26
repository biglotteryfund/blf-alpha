const injectHeroImage = require('../../middleware/inject-hero');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, injectHeroImage(routeConfig), (req, res) => {
        const lang = req.i18n.__(routeConfig.lang);

        res.render(routeConfig.template, {
            copy: lang,
            title: lang.title
        });
    });
}

module.exports = {
    init
};
