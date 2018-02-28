'use strict';
const config = require('config');
const app = require('../server');
const { customEvent } = require('../modules/analytics');
const { shouldServe } = require('../modules/pageLogic');
const { isWelsh, makeWelsh, removeWelsh } = require('../modules/urls');

function serveRedirects({ redirects, makeBilingual = false }) {
    redirects.filter(shouldServe).forEach(redirect => {
        app.get(redirect.path, (req, res) => {
            res.redirect(301, redirect.destination);
        });

        if (makeBilingual) {
            app.get(makeWelsh(redirect.path), (req, res) => {
                res.redirect(301, makeWelsh(redirect.destination));
            });
        }
    });
}

/**
 * Redirect archived links to the national archives
 */
function redirectArchived(req, res) {
    const fullUrl = `https://${config.get('siteDomain')}${req.originalUrl}`;
    customEvent('redirect', 'National Archives', req.originalUrl);
    res.redirect(301, `http://webarchive.nationalarchives.gov.uk/*/${fullUrl}`);
}

function redirectNoWelsh(req, res, next) {
    if (isWelsh(req.originalUrl)) {
        res.redirect(removeWelsh(req.originalUrl));
    } else {
        next();
    }
}

module.exports = {
    serveRedirects,
    redirectArchived,
    redirectNoWelsh
};
