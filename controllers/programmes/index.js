'use strict';
const path = require('path');
const express = require('express');

const {
    injectBreadcrumbs,
    injectFundingProgramme,
    injectFundingProgrammes
} = require('../../middleware/inject-content');
const { isBilingual } = require('../../modules/pageLogic');
const { programmeFilters } = require('./helpers');
const appData = require('../../modules/appData');

const router = express.Router();

/**
 * Programmes list
 */
router.get('/', injectBreadcrumbs, injectFundingProgrammes, (req, res, next) => {
    const { copy, fundingProgrammes } = res.locals;

    if (!fundingProgrammes) {
        next();
    }

    const locationParam = programmeFilters.getValidLocation(fundingProgrammes, req.query.location);

    const programmes = fundingProgrammes
        // @TODO: Move 'null' check when all programmes have been resaved to get a default type
        .filter(p => p.programmeType === 'activeProgramme' || p.programmeType === null)
        .filter(programmeFilters.filterByLocation(locationParam))
        .filter(programmeFilters.filterByMinAmount(req.query.min))
        .filter(programmeFilters.filterByMaxAmount(req.query.max));

    if (parseInt(req.query.min, 10) === 10000) {
        res.locals.breadcrumbs.push({
            label: copy.over10k,
            url: '/over10k'
        });
    }

    if (parseInt(req.query.max, 10) === 10000) {
        res.locals.breadcrumbs.push({
            label: copy.under10k,
            url: '/under10k'
        });
    }

    if (locationParam) {
        const globalCopy = req.i18n.__('global');
        res.locals.breadcrumbs.push({
            label: {
                england: globalCopy.regions.england,
                wales: globalCopy.regions.wales,
                scotland: globalCopy.regions.scotland,
                northernIreland: globalCopy.regions.northernIreland,
                ukWide: globalCopy.regions.ukWide
            }[locationParam]
        });
    }

    // If we have more than two breadcrumbs assign a url to the second (the current page)
    if (res.locals.breadcrumbs.length > 2) {
        res.locals.breadcrumbs[1].url = req.baseUrl;
    }

    const activeBreadcrumbsSummary = map(res.locals.breadcrumbs, 'label').join(', ');

    res.render(path.resolve(__dirname, './views/programmes-list'), {
        programmes,
        activeBreadcrumbsSummary
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
