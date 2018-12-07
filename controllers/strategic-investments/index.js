'use strict';
const path = require('path');
const express = require('express');
const { concat, startsWith } = require('lodash');

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
    const { currentPath, strategicProgramme } = res.locals;
    /* Only render if not using an external path */
    if (strategicProgramme && startsWith(currentPath, strategicProgramme.linkUrl)) {
        res.render(path.resolve(__dirname, './views/strategic-programme'), {
            breadcrumbs: concat(res.locals.breadcrumbs, strategicProgramme.sectionBreadcrumbs)
        });
    } else {
        next();
    }
});

module.exports = router;
