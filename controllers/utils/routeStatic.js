'use strict';

const { forEach } = require('lodash');
const app = require('../../server');
const contentApi = require('../../services/content-api');
const { injectContent } = require('../../middleware/content');
const { renderNotFoundWithError } = require('../http-errors');

/**
 * Redirect any aliases to the canonical path
 */
function setupRedirects(sectionPath, page) {
    if (page.aliases && page.aliases.length > 0) {
        ['', '/welsh'].forEach(localePath => {
            page.aliases.forEach(pagePath => {
                app.get(localePath + pagePath, (req, res) => {
                    res.redirect(localePath + sectionPath + page.path);
                });
            });
        });
    }
}

function serveLegacyPageFromCms(page, sectionId, router) {
    router.get(page.path, (req, res) => {
        contentApi
            .getLegacyPage({
                locale: req.i18n.getLocale(),
                path: contentApi.getCmsPath(sectionId, page.path)
            })
            .then(content => {
                res.render('pages/legacy', {
                    title: content.title,
                    content: content
                });
            })
            .catch(err => {
                renderNotFoundWithError(err, req, res);
            });
    });
}

/**
 * Init routing
 * Set up path routing for a list of (static) pages
 */
function init({ pages, router, sectionPath, sectionId }) {
    /**
     * Map this section ID (for all routes in this path)
     * middleware to add a section ID to requests with a known section
     * (eg. to mark a section as current in the nav)
     */
    router.use((req, res, next) => {
        res.locals.sectionId = sectionId;
        return next();
    });

    forEach(pages, (page, pageId) => {
        // Add the page ID to the request
        router.use(page.path, (req, res, next) => {
            res.locals.pageId = pageId;
            return next();
        });

        // Redirect any aliases to the canonical path
        setupRedirects(sectionPath, page);

        if (page.isLegacyPage) {
            // Serve a static template with CMS-loaded content
            serveLegacyPageFromCms(page, sectionId, router);
        } else if (page.static) {
            /**
             * CMS content middleware
             * Look up content from CMS then hand over to next route handler
             */
            if (page.useCmsContent) {
                router.get(page.path, injectContent(sectionId));
            }

            router.get(page.path, (req, res) => {
                const content = res.locals.content;
                // @TODO: Add contentType to API response?
                if (content && content.children) {
                    res.render('pages/listings/listingPage', {
                        content
                    });
                } else if (content && content.siblings) {
                    res.render('pages/listings/informationPage', {
                        content
                    });
                } else {
                    const lang = page.lang ? req.i18n.__(page.lang) : false;
                    res.render(page.template, {
                        title: lang ? lang.title : false,
                        description: lang ? lang.description : false,
                        copy: lang
                    });
                }
            });
        }
    });
}

module.exports = {
    init
};
