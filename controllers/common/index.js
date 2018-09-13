'use strict';
const express = require('express');
const path = require('path');

const {
    injectBreadcrumbs,
    injectCaseStudies,
    injectCopy,
    injectFlexibleContent,
    injectHeroImage,
    injectListingContent
} = require('../../middleware/inject-content');
const { isWelsh } = require('../../modules/urls');

function staticPage({ template, heroSlug, lang, isBilingual = true, caseStudies = [] }) {
    const router = express.Router();

    router.get(
        '/',
        injectHeroImage(heroSlug),
        injectCopy(lang),
        injectBreadcrumbs,
        injectCaseStudies(caseStudies),
        function(req, res, next) {
            if (isBilingual === false && isWelsh(req.originalUrl)) {
                next();
            } else {
                res.render(template, { isBilingual });
            }
        }
    );

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
