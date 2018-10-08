'use strict';
const { find } = require('lodash/fp');
const contentApi = require('../services/content-api');

/**
 * Vanity URL lookup
 * - First look up global/en alias from the CMS
 * - If that fails check for a welsh specific alias
 * - Call next() and passthrough on any failures
 */
module.exports = async function vanityLookup(req, res, next) {
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
};
