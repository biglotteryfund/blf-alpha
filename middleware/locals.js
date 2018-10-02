'use strict';
const config = require('config');
const moment = require('moment');
const { includes } = require('lodash');
const appData = require('../modules/appData');

const { getCurrentUrl, getAbsoluteUrl, localify } = require('../modules/urls');

/**
 * Get normalised page title for metadata
 */
function getMetaTitle(base, pageTitle) {
    return pageTitle ? `${pageTitle} | ${base}` : base;
}

/**
 * Get current navigation section
 */
function getCurrentSection(sectionId, pageId) {
    const isHomepage = sectionId === 'toplevel' && pageId === 'home';
    if (isHomepage) {
        return 'toplevel';
    } else if (sectionId !== 'toplevel') {
        return sectionId;
    }
}

/**
 * Set request locals
 * - Local properties that depend on the request
 * - Local methods for use in views that depend on the request
 */
module.exports = {
    // Export for tests
    getCurrentSection,
    getMetaTitle,
    // Export middleware
    middleware: function(req, res, next) {
        const locale = req.i18n.getLocale();

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

        /***********************************************
         * Global view methods
         ***********************************************/

        res.locals.getMetaTitle = getMetaTitle;
        res.locals.getCurrentSection = getCurrentSection;

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

        /**
         * Allows feature flags to be passed through as query strings
         * e.g. ?enable-feature=use-new-header
         * Useful for testing new features
         */
        function queryFeature(name) {
            const featureNames = ['use-new-header', 'preview-digital-fund'];
            const enableFeatures = req.query['enable-feature'] ? req.query['enable-feature'].split(',') : [];
            const disableFeatures = req.query['disable-feature'] ? req.query['disable-feature'].split(',') : [];

            const cookieName = config.get('cookies.features');
            const featuresCookie = req.cookies[cookieName];
            const featuresCookieList = featuresCookie ? featuresCookie.split(',') : [];
            const isInCookieList = includes(featuresCookieList, name) && includes(featureNames, name);
            const enableWithQuery = includes(featureNames, name) && includes(enableFeatures, name);
            const disableWithQuery = includes(featureNames, name) && includes(disableFeatures, name);

            const setFeatureCookie = features => {
                if (features.length > 0) {
                    res.cookie(cookieName, features.join(','), {
                        httpOnly: true,
                        secure: !appData.isDev
                    });
                } else {
                    res.clearCookie(cookieName);
                }
            };

            if (disableWithQuery) {
                const newFeaturesCookieList = featuresCookieList.filter(val => val !== name);
                setFeatureCookie(newFeaturesCookieList);
                return false;
            } else if (isInCookieList) {
                return true;
            } else if (enableWithQuery) {
                featuresCookieList.push(name);
                setFeatureCookie(featuresCookieList);
                return true;
            } else {
                return false;
            }
        }

        /* Configure per-feature queries for use in templates */
        res.locals.featureUseNewHeader = queryFeature('use-new-header');
        res.locals.featurePreviewDigitalFund = queryFeature('preview-digital-fund');

        next();
    }
};
