'use strict';
const app = require('../../server');
const contentApi = require('../../services/content-api');
const { renderNotFound } = require('../http-errors');

const Raven = require('raven');

// redirect any aliases to the canonical path
let setupRedirects = (sectionPath, page) => {
    let localePaths = ['', '/welsh'];
    if (page.aliases && page.aliases.length > 0) {
        localePaths.forEach(localePath => {
            page.aliases.forEach(pagePath => {
                app.get(localePath + pagePath, (req, res) => {
                    res.redirect(localePath + sectionPath + page.path);
                });
            });
        });
    }
};

// serve a static page (eg. no special dependencies)
let servePage = (page, router) => {
    // serve the canonical path with the supplied template
    router.get(page.path, (req, res) => {
        let lang = req.i18n.__(page.lang);
        res.render(page.template, {
            title: lang.title,
            description: lang.description || false,
            copy: lang
        });
    });
};

const getCmsPath = (sectionId, pagePath) => {
    let urlPath = sectionId + pagePath;

    // toplevel sections shouldn't preprend anything
    if (sectionId === 'toplevel') {
        urlPath = pagePath.replace(/^\/+/g, '');
    }
    
    return urlPath;
};

let serveCmsPage = (page, sectionId, router) => {
    router.get(page.path, (req, res) => {
        const renderPage = content => {
            res.render('pages/legacy', {
                title: content.title,
                content: content
            });
        };

        contentApi
            .getLegacyPage({
                locale: req.i18n.getLocale(),
                path: getCmsPath(sectionId, page.path)
            })
            .then(content => {
                renderPage(content);
            })
            .catch(err => {
                Raven.captureException(err);
                renderNotFound(req, res);
            });
    });
};

// map this section ID (for all routes in this path)
// middleware to add a section ID to requests with a known section
// (eg. to mark a section as current in the nav)
let injectSection = (router, sectionId) => {
    router.use((req, res, next) => {
        res.locals.sectionId = sectionId;
        return next();
    });
};

// map this page ID (only for this path)
let injectPageId = (router, path, pageId) => {
    router.use(path, (req, res, next) => {
        res.locals.pageId = pageId;
        return next();
    });
};

// set up path routing for a list of (static) pages
let initRouting = (pages, router, sectionPath, sectionId) => {
    // first inject the section middleware
    injectSection(router, sectionId);

    // then route pages
    for (let pageId in pages) {
        let page = pages[pageId];

        // add the page ID to the request
        injectPageId(router, page.path, pageId);

        // redirect any aliases to the canonical path
        setupRedirects(sectionPath, page);

        if (page.isLegacyPage) {
            // serve a static template with CMS-loaded content
            serveCmsPage(page, sectionId, router);
        } else if (page.static) {
            // serve the page with a specific template and copy block
            servePage(page, router);
        }
    }
};

module.exports = {
    initRouting
};
