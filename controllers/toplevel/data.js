'use strict';
const Raven = require('raven');
const contentApi = require('../../services/content-api');
const { sortBy } = require('lodash');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, (req, res, next) => {
        const locale = req.i18n.getLocale();
        return Promise.all([contentApi.getStatRegions(locale), contentApi.getDataStats(locale)])
            .then(responses => {
                const [statRegions, statPage] = responses;
                res.render(routeConfig.template, {
                    statRegions: sortBy(statRegions, 'title'),
                    statPage: statPage
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
