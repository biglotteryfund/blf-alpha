'use strict';
const contentApi = require('../../services/content-api');
const { injectBreadcrumbs, injectCopy } = require('../../middleware/inject-content');

function injectCaseStudies(caseStudySlugs) {
    return async function(req, res, next) {
        res.locals.caseStudies = await contentApi.getCaseStudies({
            locale: req.i18n.getLocale(),
            slugs: caseStudySlugs
        });
        next();
    };
}

function init10k({ router, routeConfig, caseStudySlugs }) {
    router.get(
        routeConfig.path,
        injectCopy(routeConfig),
        injectBreadcrumbs,
        injectCaseStudies(caseStudySlugs),
        (req, res) => {
            res.render(routeConfig.template);
        }
    );
}

function init({ router, under10kConfig, over10kConfig }) {
    init10k({
        router: router,
        routeConfig: under10kConfig,
        caseStudySlugs: ['papyrus', 'ragroof-players', 'welsh-refugee-council']
    });

    init10k({
        router: router,
        routeConfig: over10kConfig,
        caseStudySlugs: ['croxteth-gems', 'dads-in-mind', 'cruse-bereavement-care']
    });
}

module.exports = {
    init
};
