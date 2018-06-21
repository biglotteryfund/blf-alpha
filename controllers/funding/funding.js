'use strict';
const { find, get } = require('lodash');
const { injectFundingProgrammes } = require('../../middleware/inject-content');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, injectFundingProgrammes, (req, res) => {
        const { copy, fundingProgrammes } = res.locals;

        /**
         * "Latest" programmes
         * Hardcoded for now but we may want to fetch these dynamically.
         */
        function getLatestProgrammes(programmes) {
            if (programmes) {
                const findBySlug = slug => find(programmes, p => p.urlPath === `funding/programmes/${slug}`);
                const programmeSlugs = get(copy, 'recentProgrammes', []);
                return programmeSlugs.map(findBySlug);
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
