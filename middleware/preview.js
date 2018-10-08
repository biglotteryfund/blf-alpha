'use strict';
const { PREVIEW_DOMAIN } = require('../modules/secrets');
const { requireStaffAuth } = require('./authed');

/**
 * Preview mode
 * Staff-auth powered preview mode
 */
module.exports = (req, res, next) => {
    if (req.get('host') === PREVIEW_DOMAIN) {
        let previewMode = null;
        if (req.query.draft) {
            previewMode = {
                mode: 'draft',
                id: parseInt(req.query.draft)
            };
        } else if (req.query.version) {
            previewMode = {
                mode: 'version',
                id: parseInt(req.query.version)
            };
        }

        if (previewMode) {
            res.locals.PREVIEW_MODE = previewMode;
            requireStaffAuth(req, res, next);
        } else {
            next();
        }
    } else {
        next();
    }
};
