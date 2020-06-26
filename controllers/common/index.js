'use strict';
const path = require('path');
const express = require('express');

const { injectListingContent } = require('../../common/inject-content');
const logger = require('../../common/logger');

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

function basicContent() {
    const router = express.Router();

    router.get('/', injectListingContent, function (req, res, next) {
        const { content } = res.locals;

        if (!content) {
            return next();
        }

        function logLegacyContentType(type) {
            logger.info(`Legacy content type: ${type}`, {
                service: 'common-views',
                url: req.originalUrl,
            });
        }

        /**
         * Determine template to render:
         * 1. If the response has child pages then render a listing page
         * 2. Otherwise, render an information page
         */
        if (content && content.children) {
            logLegacyContentType('listing-page');
            renderListingPage(res, content);
        } else if (
            (content && content.introduction) ||
            content.segments.length > 0 ||
            content.flexibleContent.length > 0
        ) {
            logLegacyContentType('information-page');
            res.render(path.resolve(__dirname, './views/information-page'));
        } else {
            next();
        }
    });

    return router;
}

function flexibleContentPage() {
    const router = express.Router();

    router.get('/', injectListingContent, function (req, res, next) {
        if (res.locals.content) {
            res.render(
                path.resolve(__dirname, './views/flexible-content-page')
            );
        } else {
            next();
        }
    });

    return router;
}

function renderFlexibleContentChild(req, res, entry) {
    if (entry.parent) {
        res.locals.breadcrumbs.push({
            label: entry.parent.title,
            url: entry.parent.linkUrl,
        });
    }

    res.render(path.resolve(__dirname, './views/flexible-content-page'), {
        breadcrumbs: res.locals.breadcrumbs.concat({ label: res.locals.title }),
        content: {
            flexibleContent: entry.flexibleContent,
        },
    });
}

module.exports = {
    basicContent,
    flexibleContentPage,
    renderFlexibleContentChild,
};
