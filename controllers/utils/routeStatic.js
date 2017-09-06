'use strict';

// serve a static page (eg. no special dependencies)
let servePage = (page, router) => {

    // redirect any aliases to the canonical path
    if (page.aliases && page.aliases.length > 0) {
        router.get(page.aliases, (req, res, next) => {
            res.redirect(req.baseUrl + page.path);
        });
    }

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

// set up path routing for a list of (static) pages
let initRouting = (pages, router, sectionId) => {

    // first inject the section middleware
    injectSection(router, sectionId);

    // then route pages
    for (let pageId in pages) {
        let page = pages[pageId];
        injectPageId(router, page.path, pageId);
        if (page.static) {
            servePage(page, router);
        }
    }
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

module.exports = {
    initRouting: initRouting
};