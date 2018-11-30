'use strict';
const config = require('config');
const moment = require('moment');
const { map, omitBy, isString } = require('lodash');

const { getCurrentUrl, getAbsoluteUrl, localify } = require('../modules/urls');
const routes = require('../controllers/routes');

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
    // Export for tests
    getMetaTitle,
    // Export middleware
    middleware: function(req, res, next) {
        const locale = req.i18n.getLocale();

        /**
         * Navigation sections for top-level nav
         */
        const itemsToShow = omitBy(routes.sections, s => s.showInNavigation === false);
        res.locals.navigationSections = map(itemsToShow, (section, id) => {
            return {
                id: id,
                path: localify(locale)(section.path),
                label: req.i18n.__(section.langTitlePath)
            };
        });

        /**
         * High-contrast mode
         */
        const contrastPref = req.cookies[config.get('cookies.contrast')];
        res.locals.isHighContrast = contrastPref && contrastPref === 'high';

        /**
         * Features
         */
        res.locals.enablePrompt = config.get('features.enablePrompt');
        res.locals.enableSurvey = config.get('features.enableSurvey');

        /**
         * Metadata (e.g. global title, description)
         */
        res.locals.metadata = {
            title: req.i18n.__('global.brand.title'),
            description: req.i18n.__('global.brand.description')
        };

        /**
         * Fallback hero image
         * Allows pages to fallback to a hero image where an image is hard requirement for the layout
         */
        res.locals.fallbackHeroImage = {
            small: '/assets/images/hero/hero-fallback-small.jpg',
            medium: '/assets/images/hero/hero-fallback-medium.jpg',
            large: '/assets/images/hero/hero-fallback-large.jpg',
            default: '/assets/images/hero/hero-fallback-medium.jpg',
            caption: 'Rathlin Island Development and Community Association'
        };

        /**
         * Get suitable text for <title>
         */
        res.locals.getMetaTitle = getMetaTitle;

        /**
         * Current path without query string
         */
        res.locals.currentPath = req.path;

        /**
         * Absolute URL helper
         */
        res.locals.getAbsoluteUrl = function(urlPath) {
            return getAbsoluteUrl(req, urlPath);
        };

        res.locals.getSocialImageUrl = function(socialImage) {
            if (isString(socialImage)) {
                return socialImage.indexOf('://') !== -1 ? socialImage : getAbsoluteUrl(socialImage);
            } else {
                return getAbsoluteUrl(socialImage.default);
            }
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
    }
};
