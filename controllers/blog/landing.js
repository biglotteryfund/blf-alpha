'use strict';

const { renderNotFoundWithError } = require('../http-errors');
const contentApi = require('../../services/content-api');
const injectHeroImage = require('../../middleware/inject-hero');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, injectHeroImage(routeConfig), (req, res) => {
        const lang = req.i18n.__(routeConfig.lang);

        contentApi
            .getBlogPosts({
                locale: req.i18n.getLocale()
            })
            .then(entries => {
                res.render(routeConfig.template, {
                    copy: lang,
                    title: lang.title,
                    entries: entries
                });
            })
            .catch(err => {
                renderNotFoundWithError(req, res, err);
            });
    });
}

module.exports = {
    init
};
