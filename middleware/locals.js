'use strict';
const config = require('config');
const moment = require('moment');
const { isString } = require('lodash');

const { getCurrentUrl, getAbsoluteUrl, localify } = require('../modules/urls');

const features = config.get('features');

/**
 * Set request locals
 * - Local properties that depend on the request
 * - Local methods for use in views that depend on the request
 */
module.exports = function(req, res, next) {
    const locale = req.i18n.getLocale();

    /**
     * Feature flags
     */
    res.locals.enablePrompt = features.enablePrompt;
    res.locals.enableSurvey = features.enableSurvey;
    res.locals.enableNameChangeMessage = features.enableNameChangeMessage;

    /**
     * Global copy
     */
    res.locals.globalCopy = {
        brand: req.i18n.__('global.brand')
    };

    /**
     * Global navigation model
     */
    const navCopy = req.i18n.__('global.nav');
    res.locals.globalNavigation = {
        home: {
            label: navCopy.home,
            url: localify(locale)('/')
        },
        primaryLinks: [
            {
                label: navCopy.funding,
                url: localify(locale)('/funding')
            },
            {
                label: navCopy.updates,
                url: localify(locale)('/news')
            },
            {
                label: navCopy.insights,
                url: localify(locale)('/insights')
            },
            {
                label: navCopy.contact,
                url: localify(locale)('/contact')
            }
        ],
        secondaryLinks: [
            {
                label: navCopy.about,
                url: localify(locale)('/about')
            },
            {
                label: navCopy.jobs,
                url: localify(locale)('/jobs')
            }
        ]
    };

    /**
     * Fallback hero image
     * Used where there is no image but a hard requirement for the layout and the main image fails to load
     */
    res.locals.fallbackHeroImage = {
        small: '/assets/images/hero/hero-fallback-2019-small.jpg',
        medium: '/assets/images/hero/hero-fallback-2019-medium.jpg',
        large: '/assets/images/hero/hero-fallback-2019-large.jpg',
        default: '/assets/images/hero/hero-fallback-2019-medium.jpg',
        caption: 'The Outdoor Partnership'
    };

    res.locals.getSocialImageUrl = function(socialImage) {
        if (isString(socialImage)) {
            return socialImage.indexOf('://') !== -1 ? socialImage : getAbsoluteUrl(socialImage);
        } else {
            return getAbsoluteUrl(req, socialImage.default);
        }
    };

    /**
     * Get normalised page title for metadata
     */
    res.locals.getMetaTitle = function(base, pageTitle) {
        return pageTitle ? `${pageTitle} | ${base}` : base;
    };

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

    /**
     * Current URL helper
     * (Returns just the path)
     */
    res.locals.getCurrentUrl = function(requestedLocale) {
        return getCurrentUrl(req, requestedLocale);
    };

    /**
     * Current absolute URL helper
     * (Returns the absolute URL including protocol/base)
     */
    res.locals.getCurrentAbsoluteUrl = function(requestedLocale) {
        return getAbsoluteUrl(req, getCurrentUrl(req, requestedLocale));
    };

    /**
     * View helper for outputting a path in the current locale
     */
    res.locals.localify = function(urlPath) {
        return localify(req.i18n.getLocale())(urlPath);
    };

    /**
     * View helper for formatting date in the current locale
     * @see https://momentjs.com/docs/#/displaying/format/
     *
     * @param {String} dateString
     * @param {String} format
     * @return {String}
     */
    res.locals.formatDate = function(dateString, format) {
        if (dateString) {
            return moment(dateString)
                .locale(locale)
                .format(format);
        } else {
            return '';
        }
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
};
