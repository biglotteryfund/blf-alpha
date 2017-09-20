'use strict';
const app = require('../../server');

// redirect any aliases to the canonical path
let setupRedirects = (sectionPath, page) => {
    let localePaths = ['', '/welsh'];
    if (page.aliases && page.aliases.length > 0) {
        localePaths.forEach(localePath => {
            page.aliases.forEach(pagePath => {
                app.get(localePath + pagePath, (req, res, next) => {
                    res.redirect(localePath + sectionPath + page.path);
                });
            });
        });
    }
};

// serve a static page (eg. no special dependencies)
let servePage = (page, router) => {
    // serve the canonical path with the supplied template
    router.get(page.path, (req, res, next) => {
        let lang = req.i18n.__(page.lang);
        res.render(page.template, {
            title: lang.title,
            description: lang.description || false,
            copy: lang
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

// add the request object as a local variable
// for URL rewriting in templates
// (eg. locale versions, high-contrast redirect etc)
let injectUrlRequest = (router, path) => {
    router.use(path, (req, res, next) => {
        res.locals.request = req;
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

        // store the requested URL for templates to use
        injectUrlRequest(router, page.path);

        // redirect any aliases to the canonical path
        setupRedirects(sectionPath, page);

        // auto-serve this page (if marked as static)
        if (page.static) {
            servePage(page, router);
        }
    }
};

module.exports = {
    initRouting: initRouting
};