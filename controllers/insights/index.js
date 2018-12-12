'use strict';
const express = require('express');
const path = require('path');
const features = require('config').get('features');

const {
    injectBreadcrumbs,
    injectCopy,
    injectHeroImage,
    injectResearch,
    injectResearchEntry
} = require('../../middleware/inject-content');

const router = express.Router();

if (features.enableNewInsightsSection) {
    router.get('/', injectHeroImage('hapani'), injectCopy('insights'), injectResearch, (req, res) => {
        res.render(path.resolve(__dirname, './views/insights-landing'));
    });
} else {
    router.get('/', (req, res) => {
        res.redirect('/research'); // Temporary redirect to old research section
    });
}

router.get('/:slug', injectResearchEntry, injectBreadcrumbs, (req, res, next) => {
    const { researchEntry } = res.locals;
    if (researchEntry) {
        res.render(path.resolve(__dirname, './views/insights-detail'), { entry: researchEntry });
    } else {
        next();
    }
});

module.exports = router;
