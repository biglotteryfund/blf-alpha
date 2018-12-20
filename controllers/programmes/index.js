'use strict';
const { concat, groupBy, head, map } = require('lodash');
const express = require('express');
const path = require('path');

const {
    injectBreadcrumbs,
    injectCopy,
    injectHeroImage,
    injectFundingProgramme
} = require('../../middleware/inject-content');
const { basicContent } = require('../common');
const { getValidLocation, programmeFilters } = require('./helpers');
const contentApi = require('../../services/content-api');
const { sMaxAge } = require('../../middleware/cached');

const router = express.Router();

router.use(injectBreadcrumbs, (req, res, next) => {
    const routerCrumb = {
        label: req.i18n.__('funding.programmes.title'),
        url: req.baseUrl
    };
    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, [routerCrumb]);
    next();
});

const commonHero = injectHeroImage('the-young-foundation');

/**
 * Programmes list
 */
router.get('/', commonHero, injectCopy('funding.programmes'), async (req, res, next) => {
    try {
        const response = await contentApi.getFundingProgrammes({
            locale: req.i18n.getLocale()
        });

        const allFundingProgrammes = response.result || [];

        const locationParam = getValidLocation(allFundingProgrammes, req.query.location);

        const programmesFilteredByAmount = allFundingProgrammes
            .filter(programmeFilters.filterByMinAmount(req.query.min))
            .filter(programmeFilters.filterByMaxAmount(req.query.max));

        const programmes = programmesFilteredByAmount.filter(programmeFilters.filterByLocation(locationParam));

        const ukWideProgrammes = programmesFilteredByAmount.filter(programmeFilters.filterByLocation('ukWide'));

        const groupedProgrammes =
            locationParam && locationParam !== 'ukWide'
                ? groupBy(concat(programmes, ukWideProgrammes), 'area.label')
                : null;

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
            groupedProgrammes,
            activeBreadcrumbsSummary
        });
    } catch (error) {
        next(error);
    }
});

/**
 * All programmes
 */
router.get('/all', sMaxAge('3h'), commonHero, injectCopy('funding.allProgrammes'), async (req, res, next) => {
    try {
        const response = await contentApi.getFundingProgrammes({
            locale: req.i18n.getLocale(),
            showAll: true,
            page: req.query.page || 1,
            pageLimit: 250
        });

        const allFundingProgrammes = response.result || [];

        const locationParam = getValidLocation(allFundingProgrammes, req.query.location);

        const programmes = allFundingProgrammes.filter(programmeFilters.filterByLocation(locationParam));

        /**
         * Group programmes alpha-numerically
         */
        const groupedProgrammes = groupBy(programmes, function(programme) {
            const firstLetter = head(programme.title.split('')).toUpperCase();
            return /\d/.test(firstLetter) ? '#' : firstLetter;
        });

        const breadcrumbs = concat(res.locals.breadcrumbs, [{ label: res.locals.title }]);

        if (locationParam) {
            const globalCopy = req.i18n.__('global');
            breadcrumbs.push({
                label: {
                    england: globalCopy.regions.england,
                    wales: globalCopy.regions.wales,
                    scotland: globalCopy.regions.scotland,
                    northernIreland: globalCopy.regions.northernIreland,
                    ukWide: globalCopy.regions.ukWide
                }[locationParam]
            });
        }

        // If we have more than three breadcrumbs assign a url to the third (the current page)
        if (breadcrumbs.length > 3) {
            breadcrumbs[2].url = req.baseUrl;
        }

        res.render(path.resolve(__dirname, './views/all-programmes'), {
            groupedProgrammes: groupedProgrammes,
            breadcrumbs: breadcrumbs
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Digital Fund
 */
router.use('/digital-fund', require('../digital-fund'));

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

router.use(
    '/building-better-opportunities/*',
    (req, res, next) => {
        res.locals.customAncestors = [
            {
                title: 'Building Better Opportunities',
                path: 'funding/programmes/building-better-opportunities'
            }
        ];
        next();
    },
    basicContent()
);

module.exports = router;
