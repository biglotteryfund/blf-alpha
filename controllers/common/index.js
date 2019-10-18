'use strict';
const express = require('express');
const { isEmpty } = require('lodash');
const path = require('path');
const Sentry = require('@sentry/node');

const {
    injectBreadcrumbs,
    injectCopy,
    injectFlexibleContent,
    injectHeroImage,
    injectListingContent
} = require('../../common/inject-content');
const { isWelsh } = require('../../common/urls');
const contentApi = require('../../common/content-api');

function staticPage({
    lang = null,
    template = null,
    heroSlug = null,
    projectStorySlugs = [],
    disableLanguageLink = false
} = {}) {
    const router = express.Router();

    router.get(
        '/',
        injectHeroImage(heroSlug),
        injectCopy(lang),
        injectBreadcrumbs,
        async function(req, res, next) {
            const { copy } = res.locals;
            const shouldRedirectLang =
                (disableLanguageLink === true || isEmpty(copy)) &&
                isWelsh(req.originalUrl);
            if (shouldRedirectLang) {
                next();
            } else {
                /**
                 * Inject project stories if we've been provided any slugs to fetch
                 */
                if (projectStorySlugs.length > 0) {
                    try {
                        res.locals.stories = await contentApi.getProjectStories(
                            {
                                locale: req.i18n.getLocale(),
                                slugs: projectStorySlugs
                            }
                        );
                    } catch (error) {
                        Sentry.captureException(error);
                    }
                }

                res.render(template, {
                    title: copy.title,
                    description: copy.description || false,
                    isBilingual: disableLanguageLink === false
                });
            }
        }
    );

    return router;
}

function basicContent({ lang = null, customTemplate = null } = {}) {
    const router = express.Router();

    router.get(
        '/',
        injectCopy(lang),
        injectListingContent,
        injectBreadcrumbs,
        (req, res, next) => {
            const { content } = res.locals;

            if (content) {
                /**
                 * Determine template to render:
                 * 1. If using a custom template defer to that
                 * 2. Otherwise, render a "CMS page" which handles child pages and content alike
                 */
                if (customTemplate) {
                    res.render(customTemplate);
                } else {
                    let childrenLayoutMode = 'list';
                    const childPageDisplay = content.childPageDisplay;

                    // This page should show a grid of child images
                    // but do they all have images we can use?
                    if (content.children) {
                        const missingTrailImages = content.children.some(
                            page => !page.trailImage
                        );
                        if (
                            childPageDisplay === 'grid' &&
                            !missingTrailImages
                        ) {
                            childrenLayoutMode = 'grid';
                        } else if (
                            !childPageDisplay ||
                            childPageDisplay === 'none'
                        ) {
                            childrenLayoutMode = false;
                        }
                    }

                    // Reformat the child pages for plain-text links
                    if (content.children && childrenLayoutMode === 'list') {
                        content.children = content.children.map(page => {
                            return {
                                href: page.linkUrl,
                                label: page.trailText || page.title
                            };
                        });
                    }

                    res.render(path.resolve(__dirname, './views/cms-page'), {
                        childrenLayoutMode: childrenLayoutMode
                    });
                }
            } else {
                next();
            }
        }
    );

    return router;
}

function flexibleContent() {
    const router = express.Router();

    router.get(
        '/',
        injectFlexibleContent,
        injectBreadcrumbs,
        (req, res, next) => {
            if (res.locals.content) {
                res.render(
                    path.resolve(__dirname, './views/flexible-content'),
                    {
                        flexibleContent: res.locals.content.flexibleContent
                    }
                );
            } else {
                next();
            }
        }
    );

    return router;
}

module.exports = {
    basicContent,
    flexibleContent,
    staticPage
};
