'use strict';
const config = require('config');
const express = require('express');
const moment = require('moment');
const sitemap = require('sitemap');

const { getBaseUrl, getAbsoluteUrl } = require('../../modules/urls');
const { noCache, sMaxAge } = require('../../middleware/cached');
const appData = require('../../modules/appData');
const { getCanonicalRoutes } = require('./helpers');

const router = express.Router();

const LAUNCH_DATE = moment();

router.get('/status', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Cache-Control', 'no-store,no-cache,max-age=0');

    res.json({
        APP_ENV: appData.environment,
        DEPLOY_ID: appData.deployId,
        COMMIT_ID: appData.commitId,
        BUILD_NUMBER: appData.buildNumber,
        START_DATE: LAUNCH_DATE.format('dddd, MMMM Do YYYY, h:mm:ss a'),
        UPTIME: LAUNCH_DATE.toNow(true)
    });
});

router.get('/robots.txt', noCache, (req, res) => {
    const blacklist = ['/sitecore/', '/internalcontent/', '/tools/', '/patterns', '/surveys/', '/user/'];

    // Block blacklisted urls in production, otherwise block all
    const pathsToBlock = req.get('host') === config.get('siteDomain') ? blacklist : ['/'];

    const text = [
        `User-agent: *`,
        `Sitemap: ${getAbsoluteUrl(req, '/sitemap.xml')}`,
        `${pathsToBlock.map(urlPath => `Disallow: ${urlPath}`).join('\n')}`
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain');
    res.send(text);
});

router.get('/sitemap.xml', sMaxAge('30m'), async (req, res) => {
    try {
        const canonicalRoutes = await getCanonicalRoutes();

        // @ts-ignore
        const sitemapInstance = sitemap.createSitemap({
            hostname: getBaseUrl(req),
            urls: canonicalRoutes.map(route => ({ url: route }))
        });

        sitemapInstance.toXML(function(error, xml) {
            if (error) {
                res.status(500).json(error);
            }
            res.header('Content-Type', 'application/xml');
            res.send(xml);
        });
    } catch (error) {
        res.status(500).json(error);
    }
});

module.exports = router;
