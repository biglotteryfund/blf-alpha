'use strict';
const { getSecret } = require('../modules/secrets');

// Sets a global parameter to indicate if this request came from a preview domain
module.exports = (req, res, next) => {
    let PREVIEW_DOMAIN = process.env.PREVIEW_DOMAIN || getSecret('preview.domain');
    if (req.get('host') === PREVIEW_DOMAIN) {
        let previewData = {};
        const allowedModes = ['version', 'draft'];
        allowedModes.some(mode => {
            let queryData = req.query[mode];
            if (queryData) {
                previewData.mode = mode;
                previewData.id = parseInt(queryData);
            }
            return queryData;
        });
        res.locals.PREVIEW_MODE = previewData;
    }
    return next();
};
