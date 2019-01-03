'use strict';
const express = require('express');
const { isEmpty } = require('lodash');
const path = require('path');
const Raven = require('raven');

const { injectBreadcrumbs, injectFlexibleContent, injectListingContent } = require('../../middleware/inject-content');
const { isWelsh } = require('../../modules/urls');
const contentApi = require('../../services/content-api');

function staticPage({
    template = null,
    caseStudySlugs = [],
    projectStorySlugs = [],
    disableLanguageLink = false
} = {}) {
    const router = express.Router();

    router.get('/', injectBreadcrumbs, async function(req, res, next) {
        const { copy } = res.locals;
        const shouldRedirectLang = (disableLanguageLink === true || isEmpty(copy)) && isWelsh(req.originalUrl);
        if (shouldRedirectLang) {
            next();
        } else {
            /**
             * Inject project stories if we've been provided any slugs to fetch
             * @TODO: Remove getCaseStudies when launching project stories
             */
            if (res.locals.enableProjectStories && projectStorySlugs.length > 0) {
                try {
                    res.locals.stories = await contentApi.getProjectStories({
                        locale: req.i18n.getLocale(),
                        slugs: projectStorySlugs
                    });
                } catch (error) {
                    Raven.captureException(error);
                }
            } else if (caseStudySlugs.length > 0) {
                try {
                    res.locals.caseStudies = await contentApi.getCaseStudies({
                        locale: req.i18n.getLocale(),
                        slugs: caseStudySlugs
                    });
                } catch (error) {
                    Raven.captureException(error);
                }
            }

            res.render(template, {
                title: copy.title,
                description: copy.description || false,
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
                // What layout mode should we use? (eg. do all of the children have an image?)
                const childrenMissingPhotos = content.children.some(page => !page.photo);
                const childrenLayoutMode = childrenMissingPhotos ? 'plain' : 'heroes';
                if (childrenMissingPhotos) {
                    content.children = content.children.map(page => {
                        return {
                            href: page.linkUrl,
                            label: page.trailText || page.title
                        };
                    });
                }
                res.render(path.resolve(__dirname, './views/listing-page'), {
                    childrenLayoutMode: childrenLayoutMode
                });
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
