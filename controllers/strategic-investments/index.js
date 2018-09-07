'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');

const {
    injectListingContent,
    injectStrategicProgramme,
    injectStrategicProgrammes
} = require('../../middleware/inject-content');

const router = express.Router();

// @TODO: How to get breadcrumbs more reliably;
function commonBreadcrumbs(req) {
    return [
        {
            label: req.i18n.__('global.nav.funding'),
            url: req.baseUrl
        }
    ];
}

router.get('/', injectListingContent, injectStrategicProgrammes, function(req, res) {
    const breadcrumbs = concat(commonBreadcrumbs(req), [{ label: res.locals.title, url: null }]);
    res.render(path.resolve(__dirname, './views/strategic-investments'), {
        breadcrumbs
    });
});

router.get('/:slug', injectStrategicProgramme, function(req, res, next) {
    const { strategicProgramme } = res.locals;
    if (strategicProgramme) {
        const breadcrumbs = concat(commonBreadcrumbs(req), strategicProgramme.sectionBreadcrumbs);
        res.render(path.resolve(__dirname, './views/strategic-programme'), {
            breadcrumbs
        });
    } else {
        next();
    }
});

module.exports = router;
