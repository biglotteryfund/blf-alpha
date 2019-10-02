'use strict';
const { requireStaffAuth } = require('./authed');

/**
 * Preview mode
 * Staff-auth powered preview mode
 */
module.exports = (req, res, next) => {
    const previewMode =
        req.query.token &&
        (req.query['x-craft-live-preview'] || req.query['x-craft-preview']);

    if (previewMode) {
        res.cacheControl = { noStore: true };
        res.locals.PREVIEW_MODE = previewMode;
        // Allow embedding the site via iframe for CMS live preview
        res.removeHeader('X-Frame-Options');
        requireStaffAuth(req, res, next);
    } else {
        next();
    }
};
