'use strict';
const config = require('config');
const { noCache } = require('../../middleware/cached');
const { getAbsoluteUrl } = require('../../modules/urls');

function initRobots(router) {
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
}

function init({ router }) {
    initRobots(router);
}

module.exports = {
    init
};
