'use strict';
const { PREVIEW_DOMAIN } = require('../modules/secrets');
const appData = require('../modules/appData');

/**
 * Adds a PREVIEW_MODE object if we are either
 * - In a development environment
 * - Loading from a preview domain
 */
module.exports = (req, res, next) => {
    if (appData.isDev || req.get('host') === PREVIEW_DOMAIN) {
        const previewData = {};
        const allowedModes = ['version', 'draft'];
        allowedModes.some(mode => {
            const queryData = req.query[mode];
            if (queryData) {
                previewData.mode = mode;
                previewData.id = parseInt(queryData);
            }
            return queryData;
        });
        res.locals.PREVIEW_MODE = previewData;
    }

    next();
};
