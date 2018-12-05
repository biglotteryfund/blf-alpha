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
        const { content } = res.locals;

        if (content) {
            /**
             * Determine template to render:
             * 1. If using a custom template defer to that
             * 2. If the response has child pages then render a listing page
             * 3. Otherwise, render an information page
             */
            if (customTemplate) {
                res.render(customTemplate);
            } else if (content.children) {
                res.render(path.resolve(__dirname, './views/listing-page'));
            } else if (content.introduction || content.segments.length > 0) {
                // ↑ information pages must have at least an introduction or some content segments
                res.render(path.resolve(__dirname, './views/information-page'));
            } else {
                next();
            }
        } else {
            next();
        }
    });

    return router;
}

function flexibleContent() {
    const router = express.Router();

    router.get('/', injectFlexibleContent, injectBreadcrumbs, (req, res, next) => {
        if (res.locals.content) {
            res.render(path.resolve(__dirname, './views/flexible-content'));
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
