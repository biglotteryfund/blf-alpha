'use strict';
const express = require('express');
const { isEmpty } = require('lodash');
const path = require('path');

const {
    injectBreadcrumbs,
    injectCaseStudies,
    injectFlexibleContent,
    injectListingContent
} = require('../../middleware/inject-content');
const { isWelsh } = require('../../modules/urls');

function staticPage({ template = null, caseStudies = [], disableLanguageLink = false } = {}) {
    const router = express.Router();

    router.get('/', injectBreadcrumbs, injectCaseStudies(caseStudies), function(req, res, next) {
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
        const viewData = { breadcrumbs };

        if (!content) {
            next();
        }

        /**
         * Determine template to render:
         * 1. If using a custom template defer to that
         * 2. If the response has child pages then render a listing page
         * 3. Otherwise, render an information page
         */
        if (customTemplate) {
            res.render(customTemplate, viewData);
        } else if (content.children) {
            res.render(path.resolve(__dirname, './views/listing-page'), viewData);
        } else if (content.introduction || content.segments.length > 0) {
            // ↑ information pages must have at least an introduction or some content segments
            res.render(path.resolve(__dirname, './views/information-page'), viewData);
        } else {
            next();
        }
    });

    return router;
}

function flexibleContent(customTemplate) {
    const router = express.Router();

    router.get('/', injectFlexibleContent, injectBreadcrumbs, (req, res, next) => {
        if (res.locals.entry) {
            const template = customTemplate || path.resolve(__dirname, './views/flexible-content');
            res.render(template, { content: res.locals.entry });
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
