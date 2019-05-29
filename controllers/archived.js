'use strict';
const express = require('express');
const router = express.Router();

const {
    buildArchiveUrl,
    legacyPagePaths,
    legacyFilesPath
} = require('../common/archived');

const { noCache } = require('../middleware/cached');

/**
 * Archived Routes
 * Paths in this array will be redirected to the National Archives.
 * We show an interstitial page a) to let people know the page has been archived
 * and b) to allow us to record the redirect as a page-view using standard analytics behaviour.
 */
legacyPagePaths.forEach(urlPath => {
    router.get(urlPath, noCache, function(req, res) {
        res.render('static-pages/archived', {
            title: 'Archived',
            archiveUrl: buildArchiveUrl(req.originalUrl)
        });
    });
});

/**
 * Archived files
 * Requests for legacy files will be shown an error message
 * along with a feedback form to explain what they were looking for.
 */
router.get(legacyFilesPath, (req, res) => {
    res.locals.isBilingual = false;
    res.locals.enableSiteSurvey = false;

    res.status(404).render('static-pages/legacy-file', {
        title: 'Document archived',
        filePath: req.originalUrl
    });
});

module.exports = router;
