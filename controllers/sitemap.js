'use strict';
const express = require('express');
const compose = require('lodash/fp/compose');
const concat = require('lodash/fp/concat');
const sortBy = require('lodash/fp/sortBy');
const uniqBy = require('lodash/fp/uniqBy');
const { SitemapStream } = require('sitemap');

const contentApi = require('../common/content-api');
const { getBaseUrl } = require('../common/urls');
const { sMaxAge } = require('../common/cached');

const router = express.Router();

/**
 * Build a flat list of all canonical routes
 * Combines application routes and routes defined by the CMS
 */
async function getCanonicalRoutes() {
    /**
     * Static routes
     *
     * Used for pages that are outside of the CMS, either:
     * - Hard-coded pages (like homepage and 10k pages)
     * - Landing pages (where child pages are powered by the CMS, but landing is custom)
     */
    const staticRoutes = [
        '/',
        '/about',
        '/about/our-people',
        '/apply',
        '/contact',
        '/data',
        '/funding',
        '/funding/over10k',
        '/funding/programmes',
        '/funding/programmes/all',
        '/funding/strategic-investments',
        '/funding/the-big-lunch',
        '/funding/under10k',
        '/grants',
        '/insights',
        '/jobs',
        '/jobs/benefits',
        '/news',
        '/news/blog',
        '/news/press-releases',
        '/northern-ireland',
        '/wales'
    ].map(path => {
        return {
            path: path,
            live: true
        };
    });

    const cmsCanonicalUrls = await contentApi.getRoutes();
    const combined = concat(staticRoutes, cmsCanonicalUrls);
    const filtered = combined.filter(route => route.live);
    return compose(sortBy('path'), uniqBy('path'))(filtered);
}

router.get('/', sMaxAge(1800), async function(req, res, next) {
    try {
        res.header('Content-Type', 'application/xml');

        const canonicalRoutes = await getCanonicalRoutes();

        const stream = new SitemapStream({ hostname: getBaseUrl(req) });

        canonicalRoutes.forEach(function(route) {
            stream.write({ url: route.path });
        });

        stream
            .end()
            .pipe(res)
            .on('error', function(err) {
                throw err;
            });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
