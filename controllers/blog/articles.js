'use strict';

const { isBilingual } = require('../../modules/pageLogic');
const { renderNotFoundWithError } = require('../http-errors');
const contentApi = require('../../services/content-api');

function renderPost({ req, res, entry }) {
    const activeBreadcrumbs = [
        {
            label: req.i18n.__('global.nav.blog'),
            url: req.baseUrl
        },
        {
            label: entry.category.title,
            url: entry.category.link
        }
    ];

    res.render('pages/blog/post', {
        entry: entry,
        title: entry.title,
        isBilingual: isBilingual(entry.availableLanguages),
        activeBreadcrumbs: activeBreadcrumbs
    });
}

function init({ router, routeConfig, sectionPath }) {
    router.get(routeConfig.path, function(req, res) {
        contentApi
            .getBlogDetail({
                locale: req.i18n.getLocale(),
                urlPath: req.path
            })
            .then(response => {
                const pageType = response.meta.pageType;
                if (pageType === 'blogpost') {
                    const entry = response.data.attributes;
                    renderPost({ req, res, entry });
                } else {
                    res.redirect(sectionPath);
                }
            })
            .catch(err => {
                renderNotFoundWithError(req, res, err);
            });
    });

    return router;
}

module.exports = {
    init
};
