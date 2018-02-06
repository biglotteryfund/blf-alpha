/**
 * Map this section ID (for all routes in this path)
 * middleware to add a section ID to requests with a known section
 * (eg. to mark a section as current in the nav)
 */
module.exports = function(sectionId) {
    return function(req, res, next) {
        res.locals.sectionId = sectionId;
        return next();
    };
};
