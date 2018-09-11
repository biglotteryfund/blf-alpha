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
    if (strategicProgramme) {
        const breadcrumbs = concat(res.locals.breadcrumbs, strategicProgramme.sectionBreadcrumbs);
        res.render(path.resolve(__dirname, './views/strategic-programme'), {
            breadcrumbs
        });
    } else {
        next();
    }
});

module.exports = router;
