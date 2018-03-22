'use strict';

const { forEach, isEmpty } = require('lodash');
const { getOr } = require('lodash/fp');

const { renderNotFoundWithError } = require('./http-errors');
const { sMaxAge } = require('../middleware/cached');
const injectHeroImage = require('../middleware/inject-hero');
const { shouldServe } = require('../modules/pageLogic');
const { withFallbackImage } = require('../modules/images');
const { isWelsh, stripTrailingSlashes } = require('../modules/urls');
const { serveRedirects } = require('../modules/redirects');
const contentApi = require('../services/content-api');

/**
 * Redirect any aliases to the canonical path
 */
function setupRedirects(sectionPath, page) {
    const aliases = getOr([], 'aliases')(page);
    const redirects = aliases.map(pagePath => ({
        path: pagePath,
        destination: stripTrailingSlashes(sectionPath + page.path)
    }));

    serveRedirects({
        redirects: redirects,
        makeBilingual: true
    });
}

function handleCmsPage(sectionId) {
    return function(req, res) {
        contentApi
            .getListingPage({
                locale: req.i18n.getLocale(),
                path: contentApi.getCmsPath(sectionId, req.path),
                previewMode: res.locals.PREVIEW_MODE || false
            })
            .then(content => {
                const title = content.title;
                const heroImage = content.hero;

                if (content.children) {
                    res.render('pages/listings/listingPage', {
                        title,
                        content,
                        heroImage
                    });
                } else {
                    res.render('pages/listings/informationPage', {
                        title,
                        content,
                        heroImage
                    });
                }
            })
            .catch(err => {
                renderNotFoundWithError(err, req, res);
            });
    };
}

function handleStaticPage(page) {
    return function(req, res, next) {
        const lang = page.lang ? req.i18n.__(page.lang) : false;
        const isBilingual = getOr(true, 'isBilingual')(page);
        const shouldRedirectLang = (!isBilingual || isEmpty(lang)) && isWelsh(req.originalUrl);

        if (shouldRedirectLang) {
            next();
        } else {
            res.render(page.template, {
                title: getOr(false, 'title')(lang),
                heroImage: res.locals.heroImage || page.heroImage || null,
                description: lang ? lang.description : false,
                isBilingual: isBilingual,
                copy: lang
            });
        }
    };
}

/**
 * Init routing
 * Set up path routing for a list of (static) pages
 */
function init({ pages, router, sectionPath, sectionId }) {
    forEach(pages, page => {
        if (shouldServe(page)) {
            // Redirect any aliases to the canonical path
            setupRedirects(sectionPath, page);

            if (page.useCmsContent) {
                router.get(page.path, handleCmsPage(sectionId));
            } else if (page.static) {
                const cacheMiddleware = page.sMaxAge ? sMaxAge(page.sMaxAge) : (req, res, next) => next();
                router.get(page.path, cacheMiddleware, injectHeroImage(page), handleStaticPage(page));
            }
        }
    });
}

module.exports = {
    init
};
