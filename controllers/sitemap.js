'use strict';
const { createSitemap } = require('sitemap');
const compose = require('lodash/fp/compose');
const concat = require('lodash/fp/concat');
const sortBy = require('lodash/fp/sortBy');
const uniqBy = require('lodash/fp/uniqBy');

const contentApi = require('../common/content-api');
const { getBaseUrl } = require('../common/urls');

/**
 * Build a flat list of all canonical routes
 * Combines application routes and routes defined by the CMS
 */
async function getCanonicalRoutes() {
    /**
     * Static routes
     *
     * Used for pages that are outside of the CMS, either:
     * - Hard-coded pages (like the homepage)
     * - Landing pages (where child pages are powered by the CMS, but landing is custom)
     */
    const staticRoutes = [
        '/',
        '/about',
        '/apply',
        '/data',
        '/funding',
        '/funding/programmes',
        '/funding/programmes/all',
        '/funding/strategic-investments',
        '/grants',
        '/insights',
        '/news',
        '/news/blog',
        '/news/press-releases',
    ].map((path) => {
        return {
            path: path,
            live: true,
        };
    });

    const cmsCanonicalUrls = await contentApi.getRoutes();
    const combined = concat(staticRoutes, cmsCanonicalUrls);
    const filtered = combined.filter((route) => route.live);
    return compose(sortBy('path'), uniqBy('path'))(filtered);
}

module.exports = async function (req, res, next) {
    try {
        const canonicalRoutes = await getCanonicalRoutes();

        const sitemapInstance = createSitemap({
            hostname: getBaseUrl(req),
            urls: canonicalRoutes.map((route) => ({
                url: route.path,
            })),
        });

        const xml = sitemapInstance.toXML();
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        next(error);
    }
};
