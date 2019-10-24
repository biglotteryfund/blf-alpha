'use strict';
const { flatten, get, getOr } = require('lodash/fp');
const moment = require('moment');
const Sentry = require('@sentry/node');

const { localify } = require('./urls');
const contentApi = require('./content-api');

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
function setCommonLocals({ res, entry }) {
    res.locals.title = entry.title;

    res.locals.isBilingual = entry.availableLanguages.length === 2;
    res.locals.openGraph = get('openGraph')(entry);

    res.locals.previewStatus = {
        isPreviewOrShareLink: res.locals.PREVIEW_MODE,
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
    const locale = req.i18n.getLocale();

    if (res.locals.sectionTitle && res.locals.sectionUrl) {
        const topLevelCrumb = {
            label: res.locals.sectionTitle,
            url: res.locals.sectionUrl
        };

        const ancestors =
            res.locals.customAncestors ||
            getOr([], 'ancestors')(res.locals.content);
        const ancestorCrumbs = ancestors.map(ancestor => {
            return {
                label: ancestor.title,
                url: localify(locale)(`/${ancestor.path}`)
            };
        });

        const breadcrumbs = flatten([topLevelCrumb, ancestorCrumbs]);

        const getTitle = get('title');
        const injectedTitle = res.locals.title || getTitle(res.locals.content);

        if (injectedTitle) {
            breadcrumbs.push({
                label: injectedTitle
            });
        }

        res.locals.breadcrumbs = breadcrumbs;
    }

    next();
}

async function injectListingContent(req, res, next) {
    try {
        const content = await contentApi.getListingPage({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            requestParams: req.query
        });

        if (content) {
            res.locals.content = content;
            setCommonLocals({ res, entry: content });
        }

        next();
    } catch (error) {
        next(error);
    }
}

async function injectFlexibleContent(req, res, next) {
    try {
        const content = await contentApi.getFlexibleContent({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            requestParams: req.query
        });

        if (content) {
            res.locals.content = content;
            setCommonLocals({ res, entry: content });
        }

        next();
    } catch (error) {
        next(error);
    }
}

function injectMerchandise({ locale = null, showAll = false }) {
    return async (req, res, next) => {
        try {
            const localeToUse = locale ? locale : req.i18n.getLocale();
            res.locals.availableItems = await contentApi.getMerchandise(
                localeToUse,
                showAll
            );
            next();
        } catch (error) {
            next(error);
        }
    };
}

module.exports = {
    injectBreadcrumbs,
    injectCopy,
    injectFlexibleContent,
    injectHeroImage,
    injectListingContent,
    injectMerchandise,
    setCommonLocals,
    setHeroLocals
};
