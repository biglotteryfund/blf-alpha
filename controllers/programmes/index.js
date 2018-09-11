'use strict';
const path = require('path');
const { map } = require('lodash');
const express = require('express');

const { injectFundingProgramme, injectFundingProgrammes } = require('../../middleware/inject-content');
const { isBilingual } = require('../../modules/pageLogic');
const { programmeFilters } = require('./helpers');
const appData = require('../../modules/appData');

const router = express.Router();

/**
 * Programmes list
 */
router.get('/', injectFundingProgrammes, (req, res, next) => {
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

    res.render(path.resolve(__dirname, './views/programmes-list'), templateData);
});

/**
 * Programme detail: Digital funding demo
 */
if (appData.isNotProduction) {
    router.use('/digital-funding-demo', require('./digital-fund'));
}

/**
 * Programme detail
 */
router.get('/:slug', injectFundingProgramme, (req, res, next) => {
    const entry = res.locals.fundingProgramme;

    if (entry && entry.contentSections.length > 0) {
        res.render(path.resolve(__dirname, './views/programme'), {
            entry: entry,
            title: entry.summary.title,
            heroImage: entry.hero || res.locals.fallbackHeroImage,
            isBilingual: isBilingual(entry.availableLanguages)
        });
    } else {
        next();
    }
});

module.exports = router;
