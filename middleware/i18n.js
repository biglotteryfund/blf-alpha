'use strict';
const config = require('config');
const { isWelsh } = require('../modules/urls');

module.exports = function(req, res, next) {
    let localePrefix = '';

    if (isWelsh(req.url)) {
        req.i18n.setLocale('cy');
        res.setHeader('Content-Language', 'cy');
        localePrefix = config.get('i18n.urlPrefix.cy');
    }

    /**
     * Store locale state as request locals.
     */
    res.locals.locale = req.i18n.getLocale();
    res.locals.localePrefix = localePrefix;

    next();
};
