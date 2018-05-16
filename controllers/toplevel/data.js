'use strict';
const Raven = require('raven');
const contentApi = require('../../services/content-api');
const { injectCopy } = require('../../middleware/inject-content');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, injectCopy(routeConfig), (req, res, next) => {
        const locale = req.i18n.getLocale();
        return Promise.all([contentApi.getStatBlocks(locale), contentApi.getStatRegions(locale)])
            .then(responses => {
                const [statBlocks, statRegions] = responses;
                res.render(routeConfig.template, {
                    statBlocks: statBlocks,
                    statRegions: statRegions
                });
            })
            .catch(err => {
                Raven.captureException(err);
                next();
            });
    });
}

module.exports = {
    init
};
