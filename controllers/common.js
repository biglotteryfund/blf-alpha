'use strict';
const express = require('express');
const { isEmpty } = require('lodash');

const { injectBreadcrumbs, injectListingContent, injectFlexibleContent } = require('../middleware/inject-content');
const { isBilingual } = require('../modules/pageLogic');
const { isWelsh } = require('../modules/urls');

function staticPage({ disableLanguageLink = false, template = null } = {}) {
    const router = express.Router();

    router.get('/', injectBreadcrumbs, function(req, res, next) {
        const { copy, heroImage } = res.locals;
        const shouldRedirectLang = (disableLanguageLink === true || isEmpty(copy)) && isWelsh(req.originalUrl);
        if (shouldRedirectLang) {
            next();
        } else {
            res.render(template, {
                copy: copy,
                title: copy.title,
                description: copy.description || false,
                heroImage: heroImage || null,
                isBilingual: disableLanguageLink === false
            });
        }
    });

    return router;
}

function basicContent({ customTemplate = null } = {}) {
    const router = express.Router();

    router.get('/', injectListingContent, injectBreadcrumbs, (req, res, next) => {
        const { content, breadcrumbs } = res.locals;
        if (content) {
            const template = (() => {
                if (customTemplate) {
                    return customTemplate;
                } else if (content.children) {
                    return 'common/listingPage';
                } else {
                    return 'common/informationPage';
                }
            })();

            res.render(template, { breadcrumbs });
        } else {
            next();
        }
    });

    return router;
}

function flexibleContent(customTemplate) {
    const router = express.Router();

    router.get('/', injectFlexibleContent, injectBreadcrumbs, (req, res, next) => {
        const { entry, breadcrumbs } = res.locals;
        if (entry) {
            const template = customTemplate || 'common/flexibleContent';
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

    return router;
}

module.exports = {
    basicContent,
    flexibleContent,
    staticPage
};
