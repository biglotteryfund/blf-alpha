'use strict';
const express = require('express');
const router = express.Router();

const { buildArchiveUrl, legacyPagePaths, legacyFilesPath } = require('../modules/archived');
const { noCache } = require('../middleware/cached');
const metrics = require('../modules/metrics');

/**
 * Archived Routes
 * Paths in this array will be redirected to the National Archives.
 * We show an interstitial page a) to let people know the page has been archived
 * and b) to allow us to record the redirect as a pageview using standard analytics behaviour.
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
 * Requests for legacy files (eg. stored on Sitecore) will be shown an error message
 * along with a feedback form to explain what they were looking for.
 * We also log all requests for these files to ensure we can update anything missing.
 */
router.get(legacyFilesPath, (req, res) => {
    const filePath = req.originalUrl;
    metrics.count({
        name: filePath,
        namespace: 'SITE/LEGACY_FILE',
        dimension: 'DOWNLOADED',
        value: 'REQUEST_COUNT'
    });

    res.status(404).render('static-pages/legacy-file', {
        title: 'Document archived',
        filePath: filePath
    });
});

module.exports = router;
