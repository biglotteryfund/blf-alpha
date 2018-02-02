'use strict';

const { forEach } = require('lodash');
const app = require('../../server');
const contentApi = require('../../services/content-api');
const { renderNotFoundWithError } = require('../http-errors');
const { stripTrailingSlashes } = require('../../modules/urls');
const { createHeroImage } = require('../../modules/images');

/**
 * Redirect any aliases to the canonical path
 */
function setupRedirects(sectionPath, page) {
    if (page.aliases && page.aliases.length > 0) {
        ['', '/welsh'].forEach(localePath => {
            page.aliases.forEach(pagePath => {
                app.get(localePath + pagePath, (req, res) => {
                    const redirectPath = stripTrailingSlashes(localePath + sectionPath + page.path);
                    res.redirect(301, redirectPath);
                });
            });
        });
    }
}

function handleLegacyCmsPage(page, sectionId) {
    return function(req, res) {
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
    };
}

function handleCmsPage(sectionId) {
    return function(req, res) {
        contentApi
            .getListingPage({
                locale: req.i18n.getLocale(),
                path: contentApi.getCmsPath(sectionId, req.path)
            })
            .then(content => {
                /**
                 * Allow for pages without heroes
                 * @TODO: Define better default hero image.
                 */
                const defaultHeroImage = createHeroImage({
                    small: 'hero/jobs-small.jpg',
                    medium: 'hero/jobs-medium.jpg',
                    large: 'hero/jobs-large.jpg',
                    default: 'hero/jobs-medium.jpg',
                    caption: 'Street Dreams, Grant £9,000'
                });

                if (content.children) {
                    res.render('pages/listings/listingPage', {
                        title: content.title,
                        content: content,
                        heroImage: content.hero || defaultHeroImage
                    });
                } else {
                    res.render('pages/listings/informationPage', {
                        title: content.title,
                        content: content,
                        heroImage: content.hero || defaultHeroImage
                    });
                }
            })
            .catch(err => {
                renderNotFoundWithError(err, req, res);
            });
    };
}

function handleStaticPage(page) {
    return function(req, res) {
        const lang = page.lang ? req.i18n.__(page.lang) : false;
        res.render(page.template, {
            title: lang ? lang.title : false,
            description: lang ? lang.description : false,
            copy: lang
        });
    };
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
            router.get(page.path, handleLegacyCmsPage(page, sectionId));
        } else if (page.useCmsContent) {
            router.get(page.path, handleCmsPage(sectionId));
        } else if (page.static) {
            router.get(page.path, handleStaticPage(page));
        }
    });
}

module.exports = {
    init
};
