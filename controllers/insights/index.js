'use strict';
const express = require('express');
const path = require('path');

const {
    injectBreadcrumbs,
    injectCopy,
    injectHeroImage,
    injectResearch,
    injectResearchEntry
} = require('../../middleware/inject-content');
const { buildArchiveUrl } = require('../../modules/archived');
const { localify } = require('../../modules/urls');

const router = express.Router();

router.get('/', injectHeroImage('insights-letterbox-new'), injectCopy('insights'), injectResearch, (req, res) => {
    res.render(path.resolve(__dirname, './views/insights-landing'), {
        researchArchiveUrl: buildArchiveUrl(localify(req.i18n.getLocale())('/research'))
    });
});

router.get('/:slug', injectResearchEntry, injectBreadcrumbs, (req, res, next) => {
    const { researchEntry } = res.locals;
    if (researchEntry) {
        res.render(path.resolve(__dirname, './views/insights-detail'), {
            extraCopy: req.i18n.__('insights.detail'),
            entry: researchEntry
        });
    } else {
        next();
    }
});

module.exports = router;
