'use strict';

const { renderNotFoundWithError } = require('../http-errors');
const contentApi = require('../../services/content-api');
const injectHeroImage = require('../../middleware/inject-hero');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, injectHeroImage(routeConfig), (req, res) => {
        const copy = req.i18n.__(routeConfig.lang);
        const title = req.i18n.__('global.nav.blog');

        const activeBreadcrumbs = [
            {
                label: title,
                url: req.baseUrl
            }
        ];

        contentApi
            .getBlogPosts({
                locale: req.i18n.getLocale()
            })
            .then(entries => {
                const templateData = {
                    copy,
                    title,
                    entries,
                    activeBreadcrumbs
                };

                res.render(routeConfig.template, templateData);
            })
            .catch(err => {
                renderNotFoundWithError(req, res, err);
            });
    });
}

module.exports = {
    init
};
