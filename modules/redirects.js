'use strict';
const config = require('config');
const { customEvent } = require('../modules/analytics');
const { isWelsh, removeWelsh } = require('../modules/urls');

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
    redirectArchived,
    redirectNoWelsh
};
