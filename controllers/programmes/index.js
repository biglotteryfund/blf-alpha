'use strict';
const path = require('path');
const { concat, map } = require('lodash');
const express = require('express');

const {
    injectBreadcrumbs,
    injectCopy,
    injectHeroImage,
    injectFundingProgramme,
    injectFundingProgrammes
} = require('../../middleware/inject-content');
const appData = require('../../modules/appData');

const { getValidLocation, programmeFilters } = require('./helpers');

const router = express.Router();

router.use(injectBreadcrumbs, (req, res, next) => {
    const routerCrumb = {
        label: req.i18n.__('funding.programmes.title'),
        url: req.baseUrl
    };
    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, [routerCrumb]);
    next();
});

/**
 * Programmes list
 */
router.get(
    '/',
    injectHeroImage('the-young-foundation'),
    injectCopy('funding.programmes'),
    injectFundingProgrammes,
    (req, res) => {
        const allFundingProgrammes = res.locals.fundingProgrammes || [];

        const locationParam = getValidLocation(allFundingProgrammes, req.query.location);

        const programmes = allFundingProgrammes
            // @TODO: Remove fallback condition once active programme field exists in production
            .filter(p => (p.programmeType ? p.programmeType === 'activeProgramme' : true))
            .filter(programmeFilters.filterByLocation(locationParam))
            .filter(programmeFilters.filterByMinAmount(req.query.min))
            .filter(programmeFilters.filterByMaxAmount(req.query.max));

        if (parseInt(req.query.min, 10) === 10000) {
            res.locals.breadcrumbs.push({
                label: res.locals.copy.over10k,
                url: '/over10k'
            });
        }

        if (parseInt(req.query.max, 10) === 10000) {
            res.locals.breadcrumbs.push({
                label: res.locals.copy.under10k,
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
    }
);

/**
 * Programmes list: closed to applicants
 */
if (appData.isNotProduction) {
    router.get(
        '/closed',
        injectHeroImage('the-young-foundation'),
        injectCopy('funding.programmesClosed'),
        injectFundingProgrammes,
        (req, res) => {
            const allFundingProgrammes = res.locals.fundingProgrammes || [];
            const programmes = allFundingProgrammes.filter(p => p.programmeType === 'closedToApplicants');

            res.render(path.resolve(__dirname, './views/programmes-list'), {
                programmes,
                breadcrumbs: concat(res.locals.breadcrumbs, [{ label: res.locals.title }])
            });
        }
    );
}

/**
 * Digital Fund
 */
if (appData.isNotProduction) {
    router.use('/digital-fund', require('../digital-fund'));
}

/**
 * Programme detail
 */
router.get('/:slug', injectFundingProgramme, (req, res, next) => {
    const { fundingProgramme } = res.locals;
    if (fundingProgramme && fundingProgramme.contentSections.length > 0) {
        res.render(path.resolve(__dirname, './views/programme'), {
            entry: fundingProgramme,
            breadcrumbs: concat(res.locals.breadcrumbs, [{ label: res.locals.title }])
        });
    } else {
        next();
    }
});

module.exports = router;
