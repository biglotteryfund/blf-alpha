'use strict';

const ab = require('express-ab');
const config = require('config');
const moment = require('moment');
const Raven = require('raven');
const { assign, find, findIndex, get, map, uniq } = require('lodash');

const { heroImages } = require('../../modules/images');
const { injectCopy, injectFundingProgramme, injectFundingProgrammes } = require('../../middleware/inject-content');
const { isBilingual } = require('../../modules/pageLogic');
const { noCache } = require('../../middleware/cached');
const { splitPercentages } = require('../../modules/ab');
const appData = require('../../modules/appData');

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

            const area = get(programme.content, 'area');
            return area.value === locationValue;
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

function initProgrammesList({ router, routeConfig }) {
    router.get(routeConfig.path, injectCopy(routeConfig), injectFundingProgrammes, (req, res, next) => {
        const { fundingProgrammes } = res.locals;

        if (!fundingProgrammes) {
            next();
        }

        const templateData = {
            programmes: [],
            activeFacets: [],
            activeBreadcrumbs: []
        };

        const locationParam = programmeFilters.getValidLocation(fundingProgrammes, req.query.location);
        const minAmountParam = req.query.min;
        const maxAmountParam = req.query.max;

        templateData.programmes = fundingProgrammes
            .filter(programmeFilters.filterByLocation(locationParam))
            .filter(programmeFilters.filterByMinAmount(minAmountParam))
            .filter(programmeFilters.filterByMaxAmount(maxAmountParam));

        templateData.activeBreadcrumbs.push({
            label: req.i18n.__('global.nav.funding'),
            url: req.baseUrl
        });

        if (!minAmountParam && !maxAmountParam && !locationParam) {
            templateData.activeBreadcrumbs.push({
                label: req.i18n.__(routeConfig.lang + '.breadcrumbAll')
            });
        } else {
            templateData.activeBreadcrumbs.push({
                label: req.i18n.__(routeConfig.lang + '.title'),
                url: req.baseUrl + req.path
            });

            if (parseInt(minAmountParam, 10) === 10000) {
                templateData.activeBreadcrumbs.push({
                    label: req.i18n.__(routeConfig.lang + '.over10k'),
                    url: '/over10k'
                });
            }

            if (parseInt(maxAmountParam, 10) === 10000) {
                templateData.activeBreadcrumbs.push({
                    label: req.i18n.__(routeConfig.lang + '.under10k'),
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
                    label: locationParamToTranslation(locationParam),
                    count: templateData.programmes.length
                });
            }
        }

        templateData.activeBreadcrumbsSummary = map(templateData.activeBreadcrumbs, 'label').join(', ');

        res.render(routeConfig.template, templateData);
    });
}

function handleProgrammeDetail(modifyProgrammeMiddleware) {
    const noop = (req, res, next) => next();
    return [
        injectFundingProgramme,
        modifyProgrammeMiddleware || noop,
        (req, res) => {
            const entry = res.locals.fundingProgramme;
            if (entry.contentSections.length > 0) {
                res.render('pages/funding/programme-detail', {
                    entry: res.locals.fundingProgramme,
                    title: entry.summary.title,
                    isBilingual: isBilingual(entry.availableLanguages),
                    heroImage: entry.hero || heroImages.fallbackHeroImage
                });
            } else {
                throw new Error('NoContent');
            }
        }
    ];
}

function initProgrammeDetail({ router }) {
    router.get('/programmes/:slug', handleProgrammeDetail());
}

function initProgrammeDetailAwardsForAll({ router, routeConfig }) {
    function injectVariantModifications(req, res, next) {
        const entry = res.locals.fundingProgramme;
        const locale = req.i18n.getLocale();

        const applyTabIdx = findIndex(entry.contentSections, section => {
            return section.title.match(/How do you apply|Sut ydych chi'n ymgeisio/);
        });

        if (applyTabIdx !== -1) {
            const applyUrl = locale === 'cy' ? `${routeConfig.applyUrl}&lang=welsh` : routeConfig.applyUrl;
            const originalTextFromCMS = entry.contentSections[applyTabIdx].body;
            const awardsTextToPrepend = req.i18n.__('global.abTests.awardsForAllOnlineForm', applyUrl);
            entry.contentSections[applyTabIdx] = assign({}, entry.contentSections[applyTabIdx], {
                body: awardsTextToPrepend + originalTextFromCMS
            });
        } else {
            Raven.captureMessage('Failed to modify Awards For All page');
        }

        res.locals.fundingProgramme = entry;
        next();
    }

    const testFn = ab.test('blf-afa-rollout-england', {
        cookie: {
            name: routeConfig.abTest.cookie,
            maxAge: moment.duration(4, 'weeks').asMilliseconds()
        },
        id: routeConfig.abTest.experimentId
    });

    const percentages = splitPercentages(routeConfig.abTest.percentage);

    router.get(routeConfig.path, noCache, testFn(null, percentages.A), handleProgrammeDetail());
    router.get(
        routeConfig.path,
        noCache,
        testFn(null, percentages.B),
        handleProgrammeDetail(injectVariantModifications)
    );

    function maskUrl(req, res, next) {
        req.url = routeConfig.path;
        next();
    }

    /**
     * Expose preview URLs to see test variants directly
     */
    if (appData.isNotProduction) {
        router.get(`${routeConfig.path}/a`, maskUrl, handleProgrammeDetail());
        router.get(`${routeConfig.path}/b`, maskUrl, handleProgrammeDetail(injectVariantModifications));
    }
}

function init({ router, routeConfig }) {
    initProgrammesList({ router, routeConfig: routeConfig.programmes });

    if (config.get('features.enableAbTests')) {
        [routeConfig.programmeDetailAfaScotland].forEach(abRouteConfig => {
            initProgrammeDetailAwardsForAll({ router, routeConfig: abRouteConfig });
        });
    }

    initProgrammeDetail({ router });
}

module.exports = {
    init,
    programmeFilters
};
