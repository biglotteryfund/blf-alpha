'use strict';
const config = require('config');
const slashes = require('connect-slashes');
const { find } = require('lodash/fp');

const { customEvent } = require('../modules/analytics');
const { isWelsh, removeWelsh } = require('../modules/urls');
const contentApi = require('../services/content-api');

/**
 * Clean link noise
 * Strips trailing /~/~/~/link.apsx noise from old Sitecore genrated URLs
 */
function cleanLinkNoise(originalUrl) {
    const re = /(~\/)*link.aspx$/;
    if (re.test(originalUrl)) {
        return originalUrl.replace(re, '');
    } else {
        return originalUrl;
    }
}

/**************************************
 * Middlewares
 **************************************/

function redirectNonWww(req, res, next) {
    const host = req.headers.host;
    const domainProd = 'biglotteryfund.org.uk';
    if (host === domainProd) {
        const redirectUrl = `${req.protocol}://www.${domainProd}${req.originalUrl}`;
        return res.redirect(301, redirectUrl);
    } else {
        return next();
    }
}

function redirectLinkNoise(req, res, next) {
    const cleanedUrl = cleanLinkNoise(req.originalUrl);
    if (cleanedUrl !== req.originalUrl) {
        res.redirect(301, cleanedUrl);
    } else {
        next();
    }
}

const removeTrailingSlashes = slashes(false);

/**
 * Redirect archived links to the national archives
 */
function redirectArchived(req, res) {
    const fullUrl = `https://${config.get('siteDomain')}${req.originalUrl}`;
    customEvent('redirect', 'National Archives', req.originalUrl);
    res.redirect(301, `http://webarchive.nationalarchives.gov.uk/${fullUrl}`);
}

function redirectNoWelsh(req, res, next) {
    if (isWelsh(req.originalUrl)) {
        res.redirect(removeWelsh(req.originalUrl));
    } else {
        next();
    }
}

/**
 * Vanity URL lookup
 * - First look up global/en alias from the CMS
 * - If that fails check for a welsh specific alias
 * - Call next() and passthrough on any failures
 */
async function vanityLookup(req, res, next) {
    const findAlias = find(alias => alias.from === req.path);
    try {
        const enAliases = await contentApi.getAliases({ locale: 'en' });
        const enMatch = findAlias(enAliases);
        if (enMatch) {
            res.redirect(301, enMatch.to);
        } else {
            try {
                const cyAliases = await contentApi.getAliases({ locale: 'cy' });
                const cyMatch = find(alias => alias.from === req.path)(cyAliases);
                if (cyMatch) {
                    res.redirect(301, cyMatch.to);
                } else {
                    next();
                }
            } catch (e) {
                next();
            }
        }
    } catch (e) {
        next();
    }
}

module.exports = {
    common: [redirectNonWww, redirectLinkNoise, removeTrailingSlashes],
    cleanLinkNoise,
    redirectNonWww,
    removeTrailingSlashes,
    redirectArchived,
    redirectNoWelsh,
    vanityLookup
};
