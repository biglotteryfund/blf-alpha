'use strict';
const { cleanLinkNoise } = require('../modules/urls');

/**
 * Global redirects
 * - Redirect non-www to www-
 * - clean link noise from urls and redirect
 */
module.exports = function(req, res, next) {
    const host = req.headers.host;
    const domainProd = 'biglotteryfund.org.uk';
    if (host === domainProd) {
        const redirectUrl = `${req.protocol}://www.${domainProd}${req.originalUrl}`;
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
