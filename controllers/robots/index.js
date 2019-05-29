'use strict';
const express = require('express');
const sitemap = require('sitemap');
const domains = require('config').get('domains');
const { includes, concat } = require('lodash');

const { getBaseUrl, getAbsoluteUrl } = require('../../common/urls');
const { getCanonicalRoutes } = require('../../common/route-helpers');
const { legacyPagePaths, legacyFilesPath } = require('../../common/archived');
const { noCache, sMaxAge } = require('../../middleware/cached');

const router = express.Router();

router.get('/robots.txt', noCache, (req, res) => {
    const isIndexable = includes(domains.indexable, req.get('host')) === true;

    // Merge archived paths with internal / deliberately excluded URLs
    const disallowList = concat(
        ['/api/', '/funding/grants/', '/welsh/funding/grants/'],
        legacyFilesPath,
        legacyPagePaths
    );

    const text = [
        `user-agent: *`,
        `sitemap: ${getAbsoluteUrl(req, '/sitemap.xml')}`,
        `${
            isIndexable
                ? disallowList.map(line => `disallow: ${line}`).join('\n')
                : 'disallow: /'
        }`
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
