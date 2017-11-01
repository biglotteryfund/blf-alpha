'use strict';
const queryString = require('query-string');
const { find, get, pickBy, uniq } = require('lodash');
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
        let lang = req.i18n.__(config.lang);

        const templateData = {
            copy: lang,
            title: lang.title,
            programmes: [],
            activeFacets: [],
            activeBreadcrumbs: [],
            useFacets: false
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

                const locationParamToTranslation = key => {
                    const regions = {
                        england: 'England',
                        wales: 'Wales',
                        scotland: 'Scotland',
                        northernIreland: 'Northern Ireland'
                    };
                    return regions[key];
                };

                function removeFacetUrl(req, name) {
                    const queryWithoutCurrentFacet = pickBy(req.query, (val, key) => key !== name);
                    const urlWithoutQuery = req.originalUrl.split('?').shift();
                    const newQueryString = queryString.stringify(queryWithoutCurrentFacet);
                    return newQueryString.length > 0 ? `${urlWithoutQuery}?${newQueryString}` : urlWithoutQuery;
                }

                templateData.useFacets = !!req.query.useFacets === true;

                if (templateData.useFacets) {
                    if (minAmountParam) {
                        const translationKey = minAmountParam > 1000 ? 'over10k' : 'under10k';
                        templateData.activeFacets.push({
                            label: req.i18n.__(config.lang + `.${translationKey}`),
                            url: removeFacetUrl(req, 'min')
                        });
                    }

                    if (locationParam) {
                        templateData.activeFacets.push({
                            label: req.i18n.__(
                                'funding.programmes.breadcrumbLocation',
                                locationParamToTranslation(locationParam)
                            ),
                            url: removeFacetUrl(req, 'location')
                        });
                    }
                } else {
                    templateData.activeBreadcrumbs.push({
                        label: req.i18n.__(config.lang + '.over10k'),
                        url: '/over10k'
                    });

                    if (locationParam) {
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
