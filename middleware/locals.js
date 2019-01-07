'use strict';
const config = require('config');
const moment = require('moment');
const { map, omitBy, isString } = require('lodash');

const { getCurrentUrl, getAbsoluteUrl, localify } = require('../modules/urls');
const { REBRAND_SECRET } = require('../modules/secrets');
const appData = require('../modules/appData');
const routes = require('../controllers/routes');

const cookies = config.get('cookies');
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
     * High-contrast mode
     */
    const contrastPref = req.cookies[cookies.contrast];
    res.locals.isHighContrast = contrastPref && contrastPref === 'high';

    /**
     * Rebrand flag
     */
    const useNewBrand =
        appData.isNotProduction &&
        (!!process.env.USE_NEW_BRAND === true || req.cookies[cookies.rebrand] === REBRAND_SECRET);

    res.locals.useNewBrand = useNewBrand;

    /**
     * New domain flag
     */
    res.locals.usingNewDomain = req.get('host') === 'www.tnlcommunityfund.org.uk';

    /**
     * Global copy
     */
    const globalCopy = {
        brand: useNewBrand ? req.i18n.__('global.rebrand') : req.i18n.__('global.brand')
    };
    res.locals.globalCopy = globalCopy;

    /**
     * Navigation sections for top-level nav
     * @TODO: Delete in favour of globalNavigation post-rebrand
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
                label: navCopy.research,
                url: localify(locale)('/research')
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
     * Allows pages to fallback to a hero image where an image is hard requirement for the layout
     */
    res.locals.fallbackHeroImage = {
        small: '/assets/images/hero/hero-fallback-small.jpg',
        medium: '/assets/images/hero/hero-fallback-medium.jpg',
        large: '/assets/images/hero/hero-fallback-large.jpg',
        default: '/assets/images/hero/hero-fallback-medium.jpg',
        caption: 'Rathlin Island Development and Community Association'
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
};
