'use strict';
const path = require('path');
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
});

/**
 * Programmes list: closed to applicants
 */
router.get('/closed', injectFundingProgrammes, (req, res, next) => {
    const { fundingProgrammes } = res.locals;

    if (!fundingProgrammes) {
        next();
    }

    const templateData = {
        programmes: fundingProgrammes.filter(p => p.programmeType === 'closedToApplicants')
    };

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
