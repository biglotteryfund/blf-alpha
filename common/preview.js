'use strict';
const { requireStaffAuth } = require('./authed');
const checkPreviewMode = require('./check-preview-mode');

/**
 * Preview mode
 * Staff-auth powered preview mode
 */
module.exports = (req, res, next) => {
    const previewMode = checkPreviewMode(req.query);
    if (previewMode.isPreview) {
        res.cacheControl = { noStore: true };
        res.locals.PREVIEW_MODE = true;

        if (previewMode.isLivePreview) {
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
