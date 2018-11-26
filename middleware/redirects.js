'use strict';
const { cleanLinkNoise } = require('../modules/urls');
const config = require('config');
const domains = config.get('domains');

/**
 * Global redirects
 * - Redirect non-www to www-
 * - clean link noise from urls and redirect
 */
module.exports = function(req, res, next) {
    const host = req.headers.host;
    if (host === domains.host) {
        const redirectUrl = `${req.protocol}://${domains.www}${req.originalUrl}`;
        return res.redirect(301, redirectUrl);
    } else {
        const cleanedUrl = cleanLinkNoise(req.originalUrl);
        if (cleanedUrl !== req.originalUrl) {
            res.redirect(301, cleanedUrl);
        } else {
            next();
        }
    }
};
