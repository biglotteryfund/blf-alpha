'use strict';
const path = require('path');

const appData = require('../../modules/appData');
const {
    injectBreadcrumbs,
    injectListingContent,
    injectStrategicProgramme,
    injectStrategicProgrammes
} = require('../../middleware/inject-content');

function initStrategicInvestmentsLanding(router) {
    router.get('/strategic-investments', injectListingContent, injectBreadcrumbs, injectStrategicProgrammes, function(
        req,
        res
    ) {
        res.render(path.resolve(__dirname, './views/strategic-investments'));
    });
}

function initStrategicProgrammeDetail(router) {
    router.get('/strategic-investments/:slug', injectStrategicProgramme, function(req, res, next) {
        const { strategicProgramme } = res.locals;
        if (strategicProgramme) {
            // @TODO: Return these from the content api response
            const breadcrumbs = [
                {
                    label: req.i18n.__('global.nav.funding'),
                    url: req.baseUrl
                },
                {
                    label: 'Strategic investments in England',
                    url: req.baseUrl + '/strategic'
                },
                {
                    label: strategicProgramme.title
                }
            ];

            res.render(path.resolve(__dirname, './views/strategic-programme'), {
                breadcrumbs
            });
        } else {
            next();
        }
    });
}

function init({ router }) {
    if (appData.isNotProduction) {
        initStrategicInvestmentsLanding(router);
        initStrategicProgrammeDetail(router);
    }
}

module.exports = {
    init
};
