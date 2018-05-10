'use strict';

const { forEach, isEmpty } = require('lodash');
const { getOr } = require('lodash/fp');

const { sMaxAge } = require('../middleware/cached');
const { isBilingual, shouldServe } = require('../modules/pageLogic');
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
    return function(req, res, next) {
        contentApi
            .getListingPage({
                locale: req.i18n.getLocale(),
                path: contentApi.getCmsPath(sectionId, req.path),
                previewMode: res.locals.PREVIEW_MODE || false
            })
            .then(content => {
                const viewData = {
                    content: content,
                    title: content.title,
                    heroImage: content.hero,
                    isBilingual: isBilingual(content.availableLanguages)
                };

                if (content.children) {
                    res.render('pages/listings/listingPage', viewData);
                } else {
                    res.render('pages/listings/informationPage', viewData);
                }
            })
            .catch(() => next());
    };
}

function handleStaticPage(page) {
    return function(req, res, next) {
        const lang = page.lang ? req.i18n.__(page.lang) : false;
        const isBilingualOverride = getOr(true, 'isBilingual')(page);
        const shouldRedirectLang = (!isBilingualOverride || isEmpty(lang)) && isWelsh(req.originalUrl);

        if (shouldRedirectLang) {
            next();
        } else {
            res.render(page.template, {
                title: getOr(false, 'title')(lang),
                heroImage: res.locals.heroImage || null,
                description: lang ? lang.description : false,
                isBilingual: isBilingualOverride,
                copy: lang
            });
        }
    };
}

/**
 * Init routing
 * Set up path routing for a list of (static) pages
 */
function init({ router, pages, sectionPath, sectionId }) {
    forEach(pages, page => {
        if (shouldServe(page)) {
            // Redirect any aliases to the canonical path
            setupRedirects(sectionPath, page);

            if (page.static) {
                const cacheMiddleware = page.sMaxAge ? sMaxAge(page.sMaxAge) : (req, res, next) => next();
                router.get(page.path, cacheMiddleware, handleStaticPage(page));
            } else if (page.useCmsContent) {
                router.get(page.path, handleCmsPage(sectionId));
            }
        }
    });

    return router;
}

module.exports = {
    init
};
