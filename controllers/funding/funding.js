'use strict';
const { find, get } = require('lodash');
const { sMaxAge } = require('../../middleware/cached');
const injectHeroImage = require('../../middleware/inject-hero');
const contentApi = require('../../services/content-api');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, sMaxAge(routeConfig.sMaxAge), injectHeroImage(routeConfig), (req, res) => {
        const lang = req.i18n.__(routeConfig.lang);

        /**
         * "Latest" programmes
         * Hardcoded for now but we may want to fetch these dynamically.
         */
        function getLatestProgrammes(programmes) {
            const findBySlug = slug => find(programmes, p => p.urlPath === `funding/programmes/${slug}`);
            const programmeSlugs = get(lang, 'recentProgrammes', []);
            const latestProgrammes = programmeSlugs.map(findBySlug);
            return latestProgrammes;
        }

        function renderLandingPage(programmes) {
            res.render(routeConfig.template, {
                copy: lang,
                title: lang.title,
                latestProgrammes: programmes || []
            });
        }

        contentApi
            .getFundingProgrammes({
                locale: req.i18n.getLocale()
            })
            .then(programmes => {
                const latestProgrammes = getLatestProgrammes(programmes);
                renderLandingPage(latestProgrammes);
            })
            .catch(() => {
                renderLandingPage();
            });
    });
}

module.exports = {
    init
};
