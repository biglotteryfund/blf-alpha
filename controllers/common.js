'use strict';

const { forEach, isEmpty } = require('lodash');
const { getOr } = require('lodash/fp');

const { injectBreadcrumbs, injectCopy, injectListingContent } = require('../middleware/inject-content');
const { isBilingual, shouldServe } = require('../modules/pageLogic');
const { isWelsh } = require('../modules/urls');

function handleStaticPage(page) {
    return function(req, res, next) {
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
function init({ router, pages }) {
    forEach(pages, page => {
        if (shouldServe(page)) {
            if (page.static) {
                router.get(page.path, injectCopy(page), injectBreadcrumbs, handleStaticPage(page));
            } else if (page.useCmsContent) {
                router.get(page.path, injectCopy(page), injectListingContent, injectBreadcrumbs, handleCmsPage(page));
            }
        }
    });

    return router;
}

module.exports = {
    init
};
