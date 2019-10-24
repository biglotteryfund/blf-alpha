'use strict';
const express = require('express');
const { isEmpty, get } = require('lodash');
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

function getChildrenLayoutMode(content) {
    let childrenLayoutMode = 'list';
    const childPageDisplay = get(content, 'childPageDisplay');

    // This page should show a grid of child images
    // but do they all have images we can use?
    if (content.children) {
        const missingTrailImages = content.children.some(
            page => !page.trailImage
        );
        if (childPageDisplay === 'grid' && !missingTrailImages) {
            childrenLayoutMode = 'grid';
        } else if (!childPageDisplay || childPageDisplay === 'none') {
            childrenLayoutMode = false;
        }
    }
    return childrenLayoutMode;
}

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

function basicContent({
    lang = null,
    customTemplate = null,
    cmsPage = false
} = {}) {
    const router = express.Router();

    router.get(
        '/',
        injectCopy(lang),
        injectListingContent,
        injectBreadcrumbs,
        (req, res, next) => {
            const { content } = res.locals;

            if (!content) {
                return next();
            }

            /**
             * Determine template to render:
             * 1. If using a custom template defer to that
             * 2. If using the new CMS page style, use that template
             * 2. If the response has child pages then render a listing page
             * 3. Otherwise, render an information page
             */
            if (customTemplate) {
                res.render(customTemplate);
            } else if (cmsPage) {
                const childrenLayoutMode = getChildrenLayoutMode(content);

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
            } else if (content.children) {
                // @TODO eventually deprecate these templates in favour of CMS pages (above)

                // What layout mode should we use? (eg. do all of the children have an image?)
                const missingTrailImages = content.children.some(
                    page => !page.trailImage
                );
                const childrenLayoutMode = missingTrailImages
                    ? 'plain'
                    : 'heroes';
                if (missingTrailImages) {
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
            } else if (
                content.introduction ||
                content.segments.length > 0 ||
                content.flexibleContent.length > 0
            ) {
                // ↑ information pages must have at least an introduction or some content segments
                res.render(path.resolve(__dirname, './views/information-page'));
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

function renderFlexibleContentChild(req, res, entry) {
    const breadcrumbs = entry.parent
        ? res.locals.breadcrumbs.concat([
              {
                  label: entry.parent.title,
                  url: entry.parent.linkUrl
              },
              { label: res.locals.title }
          ])
        : res.locals.breadcrumbs.concat([{ label: res.locals.title }]);

    res.render(path.resolve(__dirname, './views/flexible-content'), {
        breadcrumbs: breadcrumbs,
        flexibleContent: entry.content
    });
}

module.exports = {
    basicContent,
    flexibleContent,
    renderFlexibleContentChild,
    staticPage,
    getChildrenLayoutMode
};
