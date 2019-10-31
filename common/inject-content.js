'use strict';
const moment = require('moment');
const Sentry = require('@sentry/node');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');

const contentApi = require('./content-api');
const checkPreviewMode = require('./check-preview-mode');

/*
 * Populate hero image (with social image URLs too)
 * */
function setHeroLocals({ res, entry }) {
    // @TODO: Rename this once API has been updated back to `hero`
    const heroImage = get('heroNew.image')(entry);
    const heroCredit = get('heroNew.credit')(entry);

    if (heroImage) {
        res.locals.pageHero = {
            image: heroImage,
            credit: heroCredit
        };
        res.locals.socialImage = heroImage;
    } else {
        res.locals.pageHero = null;
    }
}

/**
 * Sets locals that are common to many entries.
 * - title based on content
 * - isBilingual based on availableLanguages property
 * - preview status metadata
 * - pageHero (with optional fallback)
 * - optional custom theme colour
 */
function setCommonLocals(req, res, entry) {
    res.locals.title = entry.title;

    res.locals.isBilingual = entry.availableLanguages.length === 2;
    res.locals.openGraph = get('openGraph')(entry);

    res.locals.previewStatus = {
        isPreview: checkPreviewMode(req.query).isPreview,
        lastUpdated: moment(entry.dateUpdated.date).format(
            'Do MMM YYYY [at] h:mma'
        )
    };

    setHeroLocals({ res, entry });
}

function injectHeroImage(heroSlug) {
    return async function(req, res, next) {
        if (heroSlug) {
            const { fallbackHeroImage } = res.locals;

            // Set defaults
            res.locals.pageHero = { image: fallbackHeroImage };
            res.locals.socialImage = fallbackHeroImage;

            try {
                const image = await contentApi.getHeroImage({
                    locale: req.i18n.getLocale(),
                    slug: heroSlug
                });

                res.locals.pageHero = { image: image };
                res.locals.socialImage = image;
                next();
            } catch (error) {
                Sentry.captureException(error);
                next();
            }
        } else {
            next();
        }
    };
}

function injectCopy(lang) {
    return function(req, res, next) {
        if (lang) {
            const copy = req.i18n.__(lang);
            res.locals.copy = copy;
            res.locals.title = copy.title;
            res.locals.description = copy.description || false;
        }

        next();
    };
}

function injectBreadcrumbs(req, res, next) {
    const breadcrumbs = getOr([], 'breadcrumbs')(res.locals);

    const getTitle = get('title');
    const injectedTitle = res.locals.title || getTitle(res.locals.content);

    if (injectedTitle) {
        breadcrumbs.push({
            label: injectedTitle
        });
    }

    res.locals.breadcrumbs = breadcrumbs;

    next();
}

async function injectListingContent(req, res, next) {
    try {
        const entry = await contentApi.getListingPage({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            requestParams: req.query
        });

        if (entry) {
            res.locals.content = entry;
            setCommonLocals(req, res, entry);
        }

        next();
    } catch (error) {
        next(error);
    }
}

async function injectFlexibleContent(req, res, next) {
    try {
        const entry = await contentApi.getFlexibleContent({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            requestParams: req.query
        });

        if (entry) {
            res.locals.content = entry;
            setCommonLocals(req, res, entry);
        }

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    injectBreadcrumbs,
    injectCopy,
    injectFlexibleContent,
    injectHeroImage,
    injectListingContent,
    setCommonLocals,
    setHeroLocals
};
