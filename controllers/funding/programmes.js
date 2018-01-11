'use strict';

const ab = require('express-ab');
const config = require('config');
const moment = require('moment');
const Raven = require('raven');
const { assign, find, findIndex, get, last, uniq } = require('lodash');

const { renderNotFoundWithError } = require('../http-errors');
const { splitPercentages } = require('../../modules/ab');
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
    },
    filterByMaxAmount(maxAmount) {
        return function(programme) {
            if (!maxAmount) {
                return programme;
            }

            const max = parseInt(maxAmount, 10);
            const programmeMax = get(programme, 'content.fundingSize.maximum');
            return programmeMax <= max || false;
        };
    }
};

function initProgrammesList(router, options) {
    router.get(options.path, (req, res, next) => {
        const lang = req.i18n.__(options.lang);
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
                const maxAmountParam = req.query.max;

                templateData.programmes = programmes
                    .filter(programmeFilters.filterByLocation(locationParam))
                    .filter(programmeFilters.filterByMinAmount(minAmountParam))
                    .filter(programmeFilters.filterByMaxAmount(maxAmountParam));

                if (!minAmountParam && !maxAmountParam && !locationParam) {
                    templateData.activeBreadcrumbs = [
                        {
                            label: req.i18n.__(options.lang + '.breadcrumbAll')
                        }
                    ];
                } else {
                    templateData.activeBreadcrumbs.push({
                        label: req.i18n.__(options.lang + '.title'),
                        url: req.originalUrl.split('?').shift()
                    });

                    if (parseInt(minAmountParam, 10) === 10000) {
                        templateData.activeBreadcrumbs.push({
                            label: req.i18n.__(options.lang + '.over10k'),
                            url: '/over10k'
                        });
                    }

                    if (parseInt(maxAmountParam, 10) === 10000) {
                        templateData.activeBreadcrumbs.push({
                            label: req.i18n.__(options.lang + '.under10k'),
                            url: '/under10k'
                        });
                    }

                    if (locationParam) {
                        const locationParamToTranslation = key => {
                            const regions = {
                                england: req.i18n.__('global.regions.england'),
                                wales: req.i18n.__('global.regions.wales'),
                                scotland: req.i18n.__('global.regions.scotland'),
                                northernIreland: req.i18n.__('global.regions.northernIreland'),
                                ukWide: req.i18n.__('global.regions.ukWide')
                            };
                            return regions[key];
                        };

                        templateData.activeBreadcrumbs.push({
                            label: locationParamToTranslation(locationParam)
                        });
                    }
                }

                res.render(options.template, templateData);
            })
            .catch(err => {
                err.friendlyText = 'Unable to load funding programmes';
                next(err);
            });
    });
}

function renderProgrammeDetail({ res, entry }) {
    /**
     * Allow for programmes without heroes
     */
    const defaultProgrammeHeroImage = createHeroImage({
        small: 'hero/working-families-small.jpg',
        medium: 'hero/working-families-medium.jpg',
        large: 'hero/working-families-large.jpg',
        default: 'hero/working-families-medium.jpg'
    });

    res.render('pages/funding/programme-detail', {
        entry: entry,
        title: entry.title,
        heroImage: entry.hero || defaultProgrammeHeroImage
    });
}

function handleProgrammeDetail(slug) {
    return function(req, res) {
        const locale = req.i18n.getLocale();
        contentApi
            .getFundingProgramme({ locale, slug })
            .then(entry => {
                if (entry.contentSections.length > 0) {
                    renderProgrammeDetail({ res, entry });
                } else {
                    throw new Error('NoContent');
                }
            })
            .catch(err => {
                renderNotFoundWithError(err, req, res);
            });
    };
}

function initProgrammeDetail(router) {
    router.get('/programmes/:slug', (req, res) => {
        handleProgrammeDetail(req.params.slug)(req, res);
    });
}

function initProgrammeDetailAfaEngland(router, options) {
    const testFn = ab.test('blf-afa-rollout-england', {
        cookie: {
            name: config.get('cookies.abTestAwardsForAll'),
            maxAge: moment.duration(4, 'weeks').asMilliseconds()
        }
    });

    // const percentageForTest = config.get('abTests.tests.awardsForAll.percentage');
    const percentages = splitPercentages(50);

    const getSlug = urlPath => last(urlPath.split('/'));

    router.get(options.path, testFn(null, percentages.A), (req, res) => {
        handleProgrammeDetail(getSlug(req.path))(req, res);
    });

    router.get(options.path, testFn(null, percentages.A), (req, res) => {
        const locale = req.i18n.getLocale();
        const slug = getSlug(req.path);
        contentApi
            .getFundingProgramme({ locale, slug })
            .then(entry => {
                if (entry.contentSections.length > 0) {
                    const applyTabIdx = findIndex(entry.contentSections, section => {
                        return section.title.match(/How do you apply/);
                    });

                    if (applyTabIdx !== -1) {
                        const replacementText = req.i18n.__('global.abTests.awardsForAllEngland');
                        const newBody = assign({}, entry.contentSections[applyTabIdx], {
                            body: replacementText[locale]
                        });
                        entry.contentSections[applyTabIdx] = newBody;
                    } else {
                        Raven.captureMessage('Failed to modify Awards For All page');
                    }

                    renderProgrammeDetail({
                        res,
                        entry
                    });
                } else {
                    throw new Error('NoContent');
                }
            })
            .catch(err => {
                renderNotFoundWithError(err, req, res);
            });
    });
}

function init({ router, routeConfig }) {
    initProgrammesList(router, routeConfig.programmes);
    initProgrammeDetailAfaEngland(router, routeConfig.programmeDetailAfaEngland);
    initProgrammeDetail(router);
}

module.exports = {
    init,
    programmeFilters
};
