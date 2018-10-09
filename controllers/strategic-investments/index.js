'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');

const {
    injectBreadcrumbs,
    injectListingContent,
    injectStrategicProgramme,
    injectStrategicProgrammes
} = require('../../middleware/inject-content');

const router = express.Router();

router.get('/', injectListingContent, injectBreadcrumbs, injectStrategicProgrammes, function(req, res) {
    res.render(path.resolve(__dirname, './views/strategic-investments'));
});

router.get('/:slug', injectBreadcrumbs, injectStrategicProgramme, function(req, res, next) {
    const { strategicProgramme } = res.locals;

    /**
     * Only render strategic investment pages if *not* using an external path
     * @TODO: Remove this when all strategic programmes pages are published on the new website.
     */
    if (strategicProgramme && /^\/funding\/strategic-investments/.test(strategicProgramme.path)) {
        const breadcrumbs = concat(res.locals.breadcrumbs, strategicProgramme.sectionBreadcrumbs);
        res.render(path.resolve(__dirname, './views/strategic-programme'), {
            breadcrumbs
        });
    } else {
        next();
    }
});

module.exports = router;
