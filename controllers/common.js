'use strict';

const { forEach, isEmpty } = require('lodash');
const { getOr } = require('lodash/fp');

const { injectListingContent } = require('../middleware/inject-content');
const { isBilingual, shouldServe } = require('../modules/pageLogic');
const { isWelsh, stripTrailingSlashes } = require('../modules/urls');
const { serveRedirects } = require('../modules/redirects');
const { sMaxAge } = require('../middleware/cached');

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

function handleCmsPage(page) {
    return (req, res, next) => {
        const content = res.locals.content;
        if (content) {
            const viewData = {
                content: content,
                title: content.displayTitle || content.title,
                heroImage: content.hero,
                breadcrumbs: res.locals.breadcrumbs,
                isBilingual: isBilingual(content.availableLanguages)
            };

            if (page.lang) {
                viewData.copy = req.i18n.__(page.lang);
            }

            const template = (() => {
                if (page.template) {
                    return page.template;
                } else if (content.children) {
                    return 'common/listingPage';
                } else {
                    return 'common/informationPage';
                }
            })();

            res.render(template, viewData);
        } else {
            next();
        }
    };
}

/**
 * Init routing
 * Set up path routing for a list of (static) pages
 */
function init({ router, pages, sectionPath }) {
    forEach(pages, page => {
        if (shouldServe(page)) {
            // Redirect any aliases to the canonical path
            setupRedirects(sectionPath, page);

            if (page.static) {
                router.get(page.path, sMaxAge(page.sMaxAge), handleStaticPage(page));
            } else if (page.useCmsContent) {
                router.get(page.path, injectListingContent, handleCmsPage(page));
            }
        }
    });

    return router;
}

module.exports = {
    init
};
