const { forEach } = require('lodash');

module.exports = function({ router, pages, sectionId }) {
    /**
     * Middleware to add a section ID to requests with a known section
     * (eg. to mark a section as current in the nav)
     */
    router.use(function(req, res, next) {
        res.locals.sectionId = sectionId;
        return next();
    });

    /**
     * Add pageId to the request for all pages in a section
     */
    forEach(pages, (page, pageId) => {
        router.use(page.path, (req, res, next) => {
            res.locals.pageId = pageId;
            return next();
        });
    });
};
