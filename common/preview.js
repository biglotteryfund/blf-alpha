'use strict';
const { requireStaffAuth } = require('./authed');

/**
 * Preview mode
 * Staff-auth powered preview mode
 */
module.exports = (req, res, next) => {
    const isLivePreview =
        req.query['x-craft-live-preview'] && req.query['token'];
    const isShareLink = req.query['x-craft-preview'] && req.query['token'];
    if (isLivePreview || isShareLink) {
        res.cacheControl = { noStore: true };
        res.locals.PREVIEW_MODE = true;
        if (isLivePreview) {
            // Allow embedding the site via iframe for CMS live preview
            res.removeHeader('X-Frame-Options');
            // Skip staff check for live preview (these URLs are secured via tokens)
            next();
        } else {
            requireStaffAuth(req, res, next);
        }
    } else {
        next();
    }
};
