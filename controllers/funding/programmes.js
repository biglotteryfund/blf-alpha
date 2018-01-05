'use strict';
const Raven = require('raven');
const { find, get, uniq } = require('lodash');
const { renderNotFound } = require('../http-errors');
const { createHeroImage } = require('../../modules/images');
const contentApi = require('../../services/content-api');

const programmeFilters = {
    getValidLocation(programmes, requestedLocation) {
        const validLocations = programmes
            .map(programme => get(programme, 'content.area.value', false))
            .filter(location => location !== false);

        const uniqLocations = uniq(validLocations);
        return find(uniqLocations, location => location === requestedLocation);
    },
    filterByLocation(locationValue) {
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
    },
    filterByMinAmount(minAmount) {
        return function(programme) {
            if (!minAmount) {
                return programme;
            }

            const data = programme.content;
            const min = parseInt(minAmount, 10);
            return !data.fundingSize || !min || data.fundingSize.minimum >= min;
        };
    }
};

function initProgrammesList(router, config) {
    router.get(config.path, (req, res) => {
        const lang = req.i18n.__(config.lang);
        const templateData = {
            copy: lang,
            title: lang.title,
            programmes: [],
            activeFacets: [],
            activeBreadcrumbs: []
        };

        contentApi
            .getFundingProgrammes({
                locale: req.i18n.getLocale()
            })
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
                        label: req.i18n.__(config.lang + '.title'),
                        url: req.originalUrl.split('?').shift()
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
    });
}

/**
 * Hacky approach to allow us to demo the concept
 * Customise hero image based on path
 * @TODO: Consider how to model hero images in the CMS, if at all.
 */
function getHeroImage(entry) {
    const heroImageMappings = {
        'funding/programmes/reaching-communities-england': createHeroImage({
            small: 'hero/placeholders/rc-small.jpg',
            medium: 'hero/placeholders/rc-medium.jpg',
            large: 'hero/placeholders/rc-large.jpg',
            default: 'hero/placeholders/rc-medium.jpg'
        }),
        'funding/programmes/awards-for-all-england': createHeroImage({
            small: 'hero/placeholders/afa-small.jpg',
            medium: 'hero/placeholders/afa-medium.jpg',
            large: 'hero/placeholders/afa-large.jpg',
            default: 'hero/placeholders/afa-medium.jpg'
        }),
        default: createHeroImage({
            small: 'hero/working-families-small.jpg',
            medium: 'hero/working-families-medium.jpg',
            large: 'hero/working-families-large.jpg',
            default: 'hero/working-families-medium.jpg'
        })
    };
    return heroImageMappings[entry.path] || heroImageMappings['default'];
}

function initProgrammeDetail(router, config) {
    router.get('/programmes/:slug', function(req, res) {
        contentApi
            .getFundingProgramme({
                locale: req.i18n.getLocale(),
                slug: req.params.slug
            })
            .then(entry => {
                if (entry.contentSections.length > 0) {
                    res.render(config.template, {
                        entry: entry,
                        title: entry.title,
                        heroImage: getHeroImage(entry)
                    });
                } else {
                    throw new Error('NoContent');
                }
            })
            .catch(err => {
                Raven.captureException(err);
                renderNotFound(req, res);
            });
    });
}

function init({ router, config }) {
    initProgrammesList(router, config.listing);
    initProgrammeDetail(router, config.detail);
}

module.exports = {
    init,
    programmeFilters
};
