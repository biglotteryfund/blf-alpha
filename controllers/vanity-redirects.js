'use strict';
const { pathCouldBeAlias } = require('../common/urls');
const contentApi = require('../common/content-api');

/**
 * Lookup vanity URL and redirect if we have a match
 */
module.exports = async function(req, res, next) {
    if (pathCouldBeAlias(req.path)) {
        try {
            const urlMatch = await contentApi.getAlias(req.path);
            if (urlMatch) {
                res.redirect(301, urlMatch);
            } else {
                next();
            }
        } catch (e) {
            next();
        }
    } else {
        next();
    }
};
