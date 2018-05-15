'use strict';
const { find, get } = require('lodash');
const { injectCopy, injectFundingProgrammes } = require('../../middleware/inject-content');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, injectCopy(routeConfig), injectFundingProgrammes, (req, res) => {
        const { copy, fundingProgrammes } = res.locals;

        /**
         * "Latest" programmes
         * Hardcoded for now but we may want to fetch these dynamically.
         */
        function getLatestProgrammes(programmes) {
            if (programmes) {
                const findBySlug = slug => find(programmes, p => p.urlPath === `funding/programmes/${slug}`);
                const programmeSlugs = get(copy, 'recentProgrammes', []);
                const latestProgrammes = programmeSlugs.map(findBySlug);
                return latestProgrammes;
            } else {
                return [];
            }
        }

        res.render(routeConfig.template, {
            latestProgrammes: getLatestProgrammes(fundingProgrammes)
        });
    });
}

module.exports = {
    init
};
