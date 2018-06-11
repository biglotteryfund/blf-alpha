'use strict';
const { includes, map } = require('lodash');

const { heroImages } = require('../../modules/images');
const { injectCopy, injectFundingProgramme, injectFundingProgrammes } = require('../../middleware/inject-content');
const { isBilingual } = require('../../modules/pageLogic');
const { localify, normaliseQuery } = require('../../modules/urls');
const { programmeFilters, reformatQueryString } = require('./programmes-helpers');
const { proxyLegacyPage, postToLegacyForm } = require('../../modules/legacy');
const { redirectWithError } = require('../http-errors');
const { stripCSPHeader } = require('../../middleware/securityHeaders');

/**
 * Route: Legacy funding finder
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

/**
 * Route: Programmes Listing
 */
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

/**
 * Route: Programme Detail
 */
function initProgrammeDetail({ router, routeConfig }) {
    router.get('/programmes/:slug', injectFundingProgramme, (req, res, next) => {
        const entry = res.locals.fundingProgramme;

        if (entry && entry.contentSections.length > 0) {
            res.render(routeConfig.template, {
                entry: entry,
                title: entry.summary.title,
                heroImage: entry.hero || heroImages.fallbackHeroImage,
                isBilingual: isBilingual(entry.availableLanguages)
            });
        } else {
            next();
        }
    });
}

function init({ router, routeConfigs }) {
    initProgrammesList({
        router: router,
        routeConfig: routeConfigs.programmes
    });

    initProgrammeDetail({
        router: router,
        routeConfig: routeConfigs.programmeDetail
    });

    initLegacyFundingFinder({
        router: router,
        routeConfig: routeConfigs.fundingFinderLegacy
    });
}

module.exports = {
    init
};
