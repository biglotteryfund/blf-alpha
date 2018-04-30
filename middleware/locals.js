'use strict';

const config = require('config');
const moment = require('moment');

const { buildUrl } = require('../modules/urls');

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
        const localePrefix = res.locals.localePrefix;

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

        /***********************************************
         * Global view methods
         ***********************************************/

        res.locals.getMetaTitle = getMetaTitle;

        /**
         * View helper for building URLs from route names
         */
        res.locals.buildUrl = function(sectionName, pageName) {
            return buildUrl(localePrefix)(sectionName, pageName);
        };

        /**
         * View helper for formatting date in the current locale
         * @param {String} dateString
         * @param {String} format
         * @see https://momentjs.com/docs/#/displaying/format/
         */
        res.locals.formatDate = function(dateString, format) {
            moment.locale(locale);
            return moment(dateString).format(format);
        };

        next();
    },
    getMetaTitle
};
