'use strict';

// serve a static page (eg. no special dependencies)
module.exports = (page, router) => {
    // redirect any aliases to the canonical path
    if (page.aliases) {
        console.log('adding aliases:', {
            aliases: page.aliases,
            destination: page.path
        });
        router.get(page.aliases, (req, res, next) => {
            res.redirect(req.baseUrl + page.path);
        });
    }

    // serve the canonical path with the supplied template
    router.get(page.path, (req, res, next) => {
        let lang = req.i18n.__(page.lang);
        res.render(page.template, {
            title: lang.title,
            copy: lang
        });
    });
};