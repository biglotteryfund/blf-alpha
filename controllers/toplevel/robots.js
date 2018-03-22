const config = require('config');
const sitemap = require('sitemap');
const { noCache, sMaxAge } = require('../../middleware/cached');
const { getBaseUrl, getAbsoluteUrl } = require('../../modules/urls');
const { getCanonicalRoutes } = require('../route-helpers');

function initRobots(router) {
    router.get('/robots.txt', noCache, (req, res) => {
        const blacklist = ['/sitecore/', '/internalcontent/', '/tools/', '/styleguide', '/surveys/', '/user/'];

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
}

function initSitemap(router) {
    router.get('/sitemap.xml', sMaxAge('30m'), (req, res) => {
        getCanonicalRoutes().then(canonicalRoutes => {
            const sitemapInstance = sitemap.createSitemap({
                hostname: getBaseUrl(req),
                urls: canonicalRoutes.map(route => ({
                    url: route.path
                }))
            });

            sitemapInstance.toXML(function(err, xml) {
                if (err) {
                    return res.status(500).end();
                }
                res.header('Content-Type', 'application/xml');
                res.send(xml);
            });
        });
    });
}

function init({ router }) {
    initRobots(router);
    initSitemap(router);
}

module.exports = {
    init
};
