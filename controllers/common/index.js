'use strict';

const path = require('path');
const { filter, forEach, isEmpty } = require('lodash');
const { getOr } = require('lodash/fp');

const { CONTENT_TYPES } = require('../route-types');
const { injectBreadcrumbs, injectListingContent, injectFlexibleContent } = require('../../middleware/inject-content');
const { isBilingual, shouldServe } = require('../../modules/pageLogic');
const { isWelsh } = require('../../modules/urls');

function handleStaticPage(router, page) {
    router.get(page.path, injectBreadcrumbs, function(req, res, next) {
        const copy = res.locals.copy;
        const isBilingualOverride = getOr(true, 'isBilingual')(page);
        const shouldRedirectLang = (!isBilingualOverride || isEmpty(copy)) && isWelsh(req.originalUrl);

        if (shouldRedirectLang) {
            next();
        } else {
            res.render(page.template, {
                copy: copy,
                title: copy.title,
                description: copy.description || false,
                heroImage: res.locals.heroImage || null,
                isBilingual: isBilingualOverride
            });
        }
    });
}

function handleBasicContentPage(router, page) {
    router.get(page.path, injectListingContent, injectBreadcrumbs, (req, res, next) => {
        const content = res.locals.content;
        if (content) {
            const viewData = {
                content: content,
                title: content.displayTitle || content.title,
                heroImage: content.hero,
                breadcrumbs: res.locals.breadcrumbs,
                isBilingual: isBilingual(content.availableLanguages)
            };

            const template = (() => {
                if (page.template) {
                    return page.template;
                } else if (content.children) {
                    return path.resolve(__dirname, './views/listingPage');
                } else {
                    return path.resolve(__dirname, './views/informationPage');
                }
            })();

            res.render(template, viewData);
        } else {
            next();
        }
    });
}

function handleFlexibleContentPage(router, page) {
    router.get(page.path, injectFlexibleContent, injectBreadcrumbs, (req, res, next) => {
        const { entry, breadcrumbs } = res.locals;
        if (entry) {
            const template = page.template || path.resolve(__dirname, './views/flexibleContent');
            res.render(template, {
                content: entry,
                title: entry.title,
                heroImage: entry.hero,
                breadcrumbs: breadcrumbs,
                isBilingual: isBilingual(entry.availableLanguages)
            });
        } else {
            next();
        }
    });
}

/**
 * Init routing
 * Set up path routing for a list of (static) pages
 */
function init({ router, pages }) {
    forEach(filter(pages, shouldServe), page => {
        switch (page.contentType) {
            case CONTENT_TYPES.STATIC:
                handleStaticPage(router, page);
                break;
            case CONTENT_TYPES.CMS_BASIC:
                handleBasicContentPage(router, page);
                break;
            case CONTENT_TYPES.CMS_FLEXIBLE_CONTENT:
                handleFlexibleContentPage(router, page);
                break;
            default:
                break;
        }
    });

    return router;
}

module.exports = {
    init
};
