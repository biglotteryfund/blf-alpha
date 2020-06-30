'use strict';
const { SitemapStream } = require('sitemap');

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
async function getCanonicalRoutes(res) {
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

    const cmsCanonicalUrls = await contentApi({
        flags: res.locals,
    }).getRoutes();
    const combined = concat(staticRoutes, cmsCanonicalUrls);
    const filtered = combined.filter((route) => route.live);
    return compose(sortBy('path'), uniqBy('path'))(filtered);
}

module.exports = async function (req, res, next) {
    try {
        const canonicalRoutes = await getCanonicalRoutes(res);

        const smStream = new SitemapStream({
            hostname: getBaseUrl(req),
        });

        canonicalRoutes.forEach((route) => {
            smStream.write({
                url: route.path,
            });
        });

        smStream.end();
        smStream.pipe(res).on('error', (e) => {
            throw e;
        });
    } catch (error) {
        next(error);
    }
};
