'use strict';
const express = require('express');
const path = require('path');

const {
    injectBreadcrumbs,
    injectCaseStudies,
    injectCopy,
    injectFlexibleContent,
    injectListingContent
} = require('../../middleware/inject-content');
const { isWelsh } = require('../../modules/urls');

function staticPage({ template, lang, isBilingual = true, caseStudies = [] }) {
    const router = express.Router();

    router.get('/', injectCopy(lang), injectBreadcrumbs, injectCaseStudies(caseStudies), function(req, res, next) {
        const { copy, heroImage } = res.locals;
        if (isBilingual === false && isWelsh(req.originalUrl)) {
            next();
        } else {
            res.render(template, {
                copy: copy,
                title: copy.title,
                description: copy.description || false,
                heroImage: heroImage || null,
                isBilingual: isBilingual
            });
        }
    });

    return router;
}

function basicContent({ lang = null, customTemplate = null } = {}) {
    const router = express.Router();

    router.get('/', injectCopy(lang), injectListingContent, injectBreadcrumbs, (req, res, next) => {
        const { content } = res.locals;
        if (content) {
            const template = (() => {
                if (customTemplate) {
                    return customTemplate;
                } else if (content.children) {
                    return path.resolve(__dirname, './views/listing-page');
                } else {
                    return path.resolve(__dirname, './views/information-page');
                }
            })();

            res.render(template);
        } else {
            next();
        }
    });

    return router;
}

function flexibleContent(customTemplate) {
    const router = express.Router();

    router.get('/', injectFlexibleContent, injectBreadcrumbs, (req, res, next) => {
        const { entry } = res.locals;
        if (entry) {
            const template = customTemplate || path.resolve(__dirname, './views/flexible-content');
            res.render(template, {
                content: entry,
                heroImage: entry.hero
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
