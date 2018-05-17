'use strict';
const { assign, findIndex, get, map } = require('lodash');
const ab = require('express-ab');
const config = require('config');
const moment = require('moment');
const Raven = require('raven');

const { heroImages } = require('../../modules/images');
const { injectCopy, injectFundingProgramme, injectFundingProgrammes } = require('../../middleware/inject-content');
const { isBilingual } = require('../../modules/pageLogic');
const { localify, normaliseQuery } = require('../../modules/urls');
const { noCache } = require('../../middleware/cached');
const { programmeFilters, reformatQueryString } = require('./programmes-helpers');
const { proxyLegacyPage, postToLegacyForm } = require('../../modules/legacy');
const { redirectWithError } = require('../http-errors');
const { splitPercentages } = require('../../modules/ab');
const { stripCSPHeader } = require('../../middleware/securityHeaders');
const appData = require('../../modules/appData');

/**
 * Legacy funding finder
 * Proxy the legacy funding finder for closed programmes (where `sc` query is present)
 * For all other requests normalise the query string and redirect to the new funding programmes list.
 */
function initLegacyFundingFinder({ router, routeConfig }) {
    router
        .route(routeConfig.path)
        .get(stripCSPHeader, (req, res) => {
            req.query = normaliseQuery(req.query);
            const showClosed = parseInt(req.query.sc, 10) === 1;
            const programmesUrl = localify(req.i18n.getLocale())('/funding/programmes');

            if (showClosed) {
                // Proxy legacy funding finder for closed programmes
                proxyLegacyPage({ req, res }).catch(error => {
                    redirectWithError(res, error, programmesUrl);
                });
            } else {
                // Redirect from funding finder to new programmes page
                const newQuery = reformatQueryString({
                    originalAreaQuery: req.query.area,
                    originalAmountQuery: req.query.amount
                });

                const redirectUrl = programmesUrl + (newQuery.length > 0 ? `?${newQuery}` : '');

                res.redirect(301, redirectUrl);
            }
        })
        .post(postToLegacyForm);
}

function initProgrammesList({ router, routeConfig }) {
    router.get(routeConfig.path, injectCopy(routeConfig), injectFundingProgrammes, (req, res, next) => {
        const { copy, fundingProgrammes } = res.locals;
        const globalCopy = req.i18n.__('global');

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
            label: globalCopy.nav.funding,
            url: req.baseUrl
        });

        if (!minAmountParam && !maxAmountParam && !locationParam) {
            templateData.activeBreadcrumbs.push({
                label: copy.breadcrumbAll
            });
        } else {
            templateData.activeBreadcrumbs.push({
                label: copy.title,
                url: req.baseUrl + req.path
            });

            if (parseInt(minAmountParam, 10) === 10000) {
                templateData.activeBreadcrumbs.push({
                    label: copy.over10k,
                    url: '/over10k'
                });
            }

            if (parseInt(maxAmountParam, 10) === 10000) {
                templateData.activeBreadcrumbs.push({
                    label: copy.under10k,
                    url: '/under10k'
                });
            }

            if (locationParam) {
                const locationParamToTranslation = key => {
                    const regions = {
                        england: globalCopy.regions.england,
                        wales: globalCopy.regions.wales,
                        scotland: globalCopy.regions.scotland,
                        northernIreland: globalCopy.regions.northernIreland,
                        ukWide: globalCopy.regions.ukWide
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
        (req, res, next) => {
            const { fundingProgramme } = res.locals;
            const contentSections = get(fundingProgramme, 'contentSections', []);
            if (contentSections.length > 0) {
                res.render('pages/funding/programme-detail', {
                    entry: fundingProgramme,
                    title: fundingProgramme.summary.title,
                    isBilingual: isBilingual(fundingProgramme.availableLanguages),
                    heroImage: fundingProgramme.hero || heroImages.fallbackHeroImage
                });
            } else {
                next();
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

function init({ router, routeConfigs }) {
    initProgrammesList({
        router: router,
        routeConfig: routeConfigs.programmes
    });

    initLegacyFundingFinder({
        router: router,
        routeConfig: routeConfigs.fundingFinderLegacy
    });

    if (config.get('features.enableAbTests')) {
        [routeConfigs.programmeDetailAfaScotland].forEach(routeConfig => {
            initProgrammeDetailAwardsForAll({ router, routeConfig });
        });
    }

    initProgrammeDetail({ router });
}

module.exports = {
    init
};
