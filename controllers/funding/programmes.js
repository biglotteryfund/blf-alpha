'use strict';
const { find, get, uniq } = require('lodash');
const contentApi = require('../../modules/content');

function getValidLocation(programmes, requestedLocation) {
    const validLocations = programmes
        .map(programme => get(programme, 'content.area.value', false))
        .filter(location => location !== false);

    const uniqLocations = uniq(validLocations);
    return find(uniqLocations, location => location === requestedLocation);
}

function filterByLocation(locationValue) {
    return function(programme) {
        if (!locationValue) {
            return programme;
        }

        return (
            !programme.content.area ||
            get(programme.content, 'area.value') === 'ukWide' ||
            get(programme.content, 'area.value') === locationValue
        );
    };
}

function filterByMinAmount(minAmount) {
    return function(programme) {
        if (!minAmount) {
            return programme;
        }

        const data = programme.content;
        const min = parseInt(minAmount, 10);
        return !data.fundingSize || !min || data.fundingSize.minimum >= min;
    };
}

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
                const locationParam = getValidLocation(programmes, req.query.location);
                const minAmountParam = req.query.min;

                templateData.programmes = programmes
                    .filter(filterByLocation(locationParam))
                    .filter(filterByMinAmount(minAmountParam));

                if (!minAmountParam && !locationParam) {
                    templateData.activeBreadcrumbs = [
                        {
                            label: req.i18n.__(config.lang + '.breadcrumbAll')
                        }
                    ];
                } else {
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
                            label: req.i18n.__(
                                'funding.programmes.breadcrumbLocation',
                                locationParamToTranslation(locationParam)
                            )
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
