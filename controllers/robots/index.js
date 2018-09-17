'use strict';
const config = require('config');
const express = require('express');
const moment = require('moment');
const sitemap = require('sitemap');

const { getBaseUrl, getAbsoluteUrl } = require('../../modules/urls');
const { getCanonicalRoutes } = require('../../modules/route-helpers');
const { noCache, sMaxAge } = require('../../middleware/cached');
const appData = require('../../modules/appData');

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
    const isProductionDomain = req.get('host') === config.get('siteDomain');

    const text = [
        `User-agent: *`,
        `Sitemap: ${getAbsoluteUrl(req, '/sitemap.xml')}`,
        `${isProductionDomain === true ? '' : 'Disallow /'}`
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain');
    res.send(text);
});

router.get('/sitemap.xml', sMaxAge('30m'), async (req, res, next) => {
    try {
        const canonicalRoutes = await getCanonicalRoutes();

        // @ts-ignore
        const sitemapInstance = sitemap.createSitemap({
            hostname: getBaseUrl(req),
            urls: canonicalRoutes.map(route => ({
                url: route.path
            }))
        });

        sitemapInstance.toXML(function(error, xml) {
            if (error) {
                next(error);
            }
            res.header('Content-Type', 'application/xml');
            res.send(xml);
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
