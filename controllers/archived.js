'use strict';
const config = require('config');
const express = require('express');
const { flatMap } = require('lodash');

const router = express.Router();

const metrics = require('../modules/metrics');
const { makeWelsh } = require('../modules/urls');
const cached = require('../middleware/cached');

/**
 * Archived Routes
 * Paths in this array will be redirected to the National Archives.
 * We show an interstitial page a) to let people know the page has been archived
 * and b) to allow us to record the redirect as a pageview using standard analytics behaviour.
 */
// prettier-ignore
flatMap([
    '/about-big/10-big-lottery-fund-facts',
    '/funding/funding-guidance/applying-for-funding/*',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-qa*'
], urlPath => [urlPath, makeWelsh(urlPath)]).forEach(urlPath => {
    router.get(urlPath, cached.noCache, function(req, res) {
        const fullUrl = `https://www.biglotteryfund.org.uk${req.originalUrl}`;
        const lastGoodCrawlDate = '20171011152352';
        const archiveUrl = `http://webarchive.nationalarchives.gov.uk/${lastGoodCrawlDate}/${fullUrl}`;
        res.render('static-pages/archived', {
            title: 'Archived',
            archiveUrl: archiveUrl
        });
    });
});

/**
 * Archived files
 * Requests for legacy files (eg. stored on Sitecore) will be shown an error message
 * along with a feedback form to explain what they were looking for.
 * We also log all requests for these files to ensure we can update anything missing.
 */
if (config.get('features.enableLegacyFileArchiving')) {
    router.get('/-/media/files/*', (req, res) => {
        const filePath = req.originalUrl;
        metrics.count({
            name: filePath,
            namespace: 'SITE/LEGACY_FILE',
            dimension: 'DOWNLOADED',
            value: 'REQUEST_COUNT'
        });
        res.render('static-pages/legacy-file', {
            title: 'Document archived',
            filePath: filePath
        });
    });
}

module.exports = router;
