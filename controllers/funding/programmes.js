'use strict';
const contentApi = require('../../modules/content');
const programmeFilters = require('../../modules/programmes');

module.exports = function(config) {
    return function(req, res) {
        const lang = req.i18n.__(config.lang);
        const templateData = {
            copy: lang,
            title: lang.title,
            programmes: [],
            activeFacets: [],
            activeBreadcrumbs: []
        };

        contentApi
            .getFundingProgrammes(req.i18n.getLocale())
            .then(response => response.data.map(item => item.attributes))
            .then(programmes => {
                const locationParam = programmeFilters.getValidLocation(programmes, req.query.location);
                const minAmountParam = req.query.min;

                templateData.programmes = programmes
                    .filter(programmeFilters.filterByLocation(locationParam))
                    .filter(programmeFilters.filterByMinAmount(minAmountParam));

                if (!minAmountParam && !locationParam) {
                    templateData.activeBreadcrumbs = [
                        {
                            label: req.i18n.__(config.lang + '.breadcrumbAll')
                        }
                    ];
                } else {
                    templateData.activeBreadcrumbs.push({
                        label: req.i18n.__(config.lang + '.title')
                    });

                    if (minAmountParam) {
                        templateData.activeBreadcrumbs.push({
                            label: req.i18n.__(config.lang + '.over10k'),
                            url: '/over10k'
                        });
                    }

                    if (locationParam) {
                        const locationParamToTranslation = key => {
                            const regions = {
                                england: req.i18n.__('global.regions.england'),
                                wales: req.i18n.__('global.regions.wales'),
                                scotland: req.i18n.__('global.regions.scotland'),
                                northernIreland: req.i18n.__('global.regions.northernIreland')
                            };
                            return regions[key];
                        };

                        templateData.activeBreadcrumbs.push({
                            label: locationParamToTranslation(locationParam)
                        });
                    }
                }

                res.render(config.template, templateData);
            })
            .catch(err => {
                console.log('error', err);
                res.send(err);
            });
    };
};
