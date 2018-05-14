'use strict';
const { get } = require('lodash');
const contentApi = require('../../services/content-api');

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
    router.get(routeConfig.path, injectCaseStudies(caseStudySlugs), (req, res) => {
        const copy = req.i18n.__(routeConfig.lang);

        const breadcrumbs = [
            {
                label: req.i18n.__('global.nav.funding'),
                url: req.baseUrl
            },
            {
                label: copy.title
            }
        ];

        res.render(routeConfig.template, {
            copy: copy,
            title: copy.title,
            description: copy.description || false,
            breadcrumbs: breadcrumbs,
            caseStudies: get(res.locals, 'caseStudies', [])
        });
    });
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
