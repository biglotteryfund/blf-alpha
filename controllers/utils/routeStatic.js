'use strict';

const { forEach } = require('lodash');
const app = require('../../server');
const contentApi = require('../../services/content-api');
const { renderNotFoundWithError } = require('../http-errors');
const { stripTrailingSlashes } = require('../../modules/urls');
const { withFallbackImage } = require('../../modules/images');
const { shouldServe } = require('../../modules/pageLogic');

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

function handleCmsPage(sectionId) {
    return function(req, res) {
        contentApi
            .getListingPage({
                locale: req.i18n.getLocale(),
                path: contentApi.getCmsPath(sectionId, req.path),
                previewMode: res.locals.PREVIEW_MODE || false
            })
            .then(content => {
                const title = content.title;
                const heroImage = withFallbackImage(content.hero);

                if (content.children) {
                    res.render('pages/listings/listingPage', {
                        title,
                        content,
                        heroImage
                    });
                } else {
                    res.render('pages/listings/informationPage', {
                        title,
                        content,
                        heroImage
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
    forEach(pages, page => {
        if (shouldServe(page)) {
            // Redirect any aliases to the canonical path
            setupRedirects(sectionPath, page);

            if (page.useCmsContent) {
                router.get(page.path, handleCmsPage(sectionId));
            } else if (page.static) {
                router.get(page.path, handleStaticPage(page));
            }
        }
    });
}

module.exports = {
    init
};
