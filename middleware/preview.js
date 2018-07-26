'use strict';
const { PREVIEW_DOMAIN } = require('../modules/secrets');

/**
 * Adds a PREVIEW_MODE object to locals if this request came from a preview domain
 */
module.exports = (req, res, next) => {
    if (req.get('host') === PREVIEW_DOMAIN) {
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
