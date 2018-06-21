'use strict';
const config = require('config');
const moment = require('moment');

const { getCurrentUrl, getAbsoluteUrl, localify } = require('../modules/urls');

/**
 * Get normalised page title for metadata
 */
function getMetaTitle(base, pageTitle) {
    return pageTitle ? `${pageTitle} | ${base}` : base;
}

/**
 * Set request locals
 * - Local properties that depend on the request
 * - Local methods for use in views that depend on the request
 */
module.exports = {
    middleware: function(req, res, next) {
        const locale = req.i18n.getLocale();

        /**
         * High-contrast mode
         */
        const contrastPref = req.cookies[config.get('cookies.contrast')];
        res.locals.isHighContrast = contrastPref && contrastPref === 'high';

        /**
         * Add the request object as a local variable
         * for URL rewriting in templates
         * (eg. locale versions, high-contrast redirect etc)
         * @TODO: Remove the need for this
         */
        res.locals.request = req;

        /**
         * Metadata (e.g. global title, description)
         */
        res.locals.metadata = {
            title: req.i18n.__('global.brand.title'),
            description: req.i18n.__('global.brand.description')
        };

        /***********************************************
         * Global view methods
         ***********************************************/

        res.locals.getMetaTitle = getMetaTitle;

        /**
         * Absolute URL helper
         */
        res.locals.getAbsoluteUrl = function(urlPath) {
            return getAbsoluteUrl(req, urlPath);
        };

        /**
         * Current URL helper
         */
        res.locals.getCurrentUrl = function(requestedLocale) {
            return getCurrentUrl(req, requestedLocale);
        };

        /**
         * View helper for outputting a path in the current locale
         */
        res.locals.localify = function(urlPath) {
            return localify(req.i18n.getLocale())(urlPath);
        };

        /**
         * View helper for formatting date in the current locale
         * @param {String} dateString
         * @param {String} format
         * @see https://momentjs.com/docs/#/displaying/format/
         */
        res.locals.formatDate = function(dateString, format) {
            return moment(dateString)
                .locale(locale)
                .format(format);
        };

        /**
         * View helper to represent date as relative time
         * @param {String} dateString
         */
        res.locals.timeFromNow = function(dateString) {
            return moment(dateString)
                .locale(locale)
                .fromNow();
        };

        next();
    },
    getMetaTitle
};
