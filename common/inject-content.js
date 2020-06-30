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
    const heroImage = get('hero.image')(entry);
    const heroCredit = get('hero.credit')(entry);

    if (heroImage) {
        res.locals.pageHero = {
            image: heroImage,
            credit: heroCredit,
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
        ),
    };

    setHeroLocals({ res, entry });
}

function injectHeroImage(heroSlug) {
    return async function (req, res, next) {
        if (heroSlug) {
            const { fallbackHeroImage } = res.locals;

            // Set defaults
            res.locals.pageHero = { image: fallbackHeroImage };
            res.locals.socialImage = fallbackHeroImage;

            try {
                const image = await contentApi({
                    flags: res.locals,
                }).getHeroImage({
                    locale: req.i18n.getLocale(),
                    slug: heroSlug,
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

async function injectListingContent(req, res, next) {
    try {
        const entry = await contentApi({ flags: res.locals }).getListingPage({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            requestParams: req.query,
        });

        if (entry) {
            res.locals.content = entry;
            setCommonLocals(req, res, entry);

            const ancestors = getOr([], 'ancestors')(entry);
            ancestors.forEach(function (ancestor) {
                res.locals.breadcrumbs.push({
                    label: ancestor.title,
                    url: ancestor.linkUrl,
                });
            });

            res.locals.breadcrumbs.push({
                label: entry.title,
            });
        }

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    injectHeroImage,
    injectListingContent,
    setCommonLocals,
    setHeroLocals,
};
