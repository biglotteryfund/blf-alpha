'use strict';

const contentApi = require('../../services/content-api');

function init10k({ router, routeConfig, caseStudySlugs }) {
    router.get(routeConfig.path, (req, res) => {
        const lang = req.i18n.__(routeConfig.lang);
        const currentLocale = req.i18n.getLocale();

        const servePage = caseStudies => {
            res.render(routeConfig.template, {
                title: lang.title,
                description: lang.description || false,
                copy: lang,
                caseStudies: caseStudies || []
            });
        };

        contentApi
            .getCaseStudies({
                locale: currentLocale,
                slugs: caseStudySlugs
            })
            .then(
                caseStudies => {
                    servePage(caseStudies);
                },
                function() {
                    servePage();
                }
            );
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
