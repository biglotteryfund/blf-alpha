'use strict';
const path = require('path');
const express = require('express');
const getOr = require('lodash/fp/getOr');

const { injectListingContent } = require('../../common/inject-content');

function renderListingPage(res, content) {
    // What layout mode should we use? (eg. do all of the children have an image?)
    const missingTrailImages = content.children.some(
        (page) => !page.trailImage
    );
    const childrenLayoutMode = missingTrailImages ? 'plain' : 'heroes';
    if (missingTrailImages) {
        content.children = content.children.map((page) => {
            return {
                href: page.linkUrl,
                label: page.trailText || page.title,
            };
        });
    }
    res.render(path.resolve(__dirname, './views/listing-page'), {
        childrenLayoutMode: childrenLayoutMode,
    });
}

function basicContent({ customTemplate = null, cmsPage = false } = {}) {
    const router = express.Router();

    router.get('/', injectListingContent, function (req, res, next) {
        const { content } = res.locals;

        if (!content) {
            return next();
        }

        const ancestors = getOr([], 'ancestors')(content);
        ancestors.forEach(function (ancestor) {
            res.locals.breadcrumbs.push({
                label: ancestor.title,
                url: ancestor.linkUrl,
            });
        });

        res.locals.breadcrumbs.push({
            label: content.title,
        });

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
            res.render(path.resolve(__dirname, './views/cms-page'));
        } else if (content.children) {
            // @TODO: Deprecate these templates in favour of CMS pages (above)
            renderListingPage(res, content);
        } else if (
            content.introduction ||
            content.segments.length > 0 ||
            content.flexibleContent.length > 0
        ) {
            res.render(path.resolve(__dirname, './views/information-page'));
        } else {
            next();
        }
    });

    return router;
}

function renderFlexibleContentChild(req, res, entry) {
    const breadcrumbs = entry.parent
        ? res.locals.breadcrumbs.concat([
              {
                  label: entry.parent.title,
                  url: entry.parent.linkUrl,
              },
              { label: res.locals.title },
          ])
        : res.locals.breadcrumbs.concat({ label: res.locals.title });

    res.render(path.resolve(__dirname, './views/flexible-content'), {
        breadcrumbs: breadcrumbs,
        flexibleContent: entry.content,
        useFlexNext: true,
    });
}

module.exports = {
    basicContent,
    renderFlexibleContentChild,
};
