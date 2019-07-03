'use strict';

module.exports = function injectCopy(langPath) {
    return function(req, res, next) {
        if (langPath) {
            const copy = req.i18n.__(langPath);
            res.locals.copy = copy;
            res.locals.title = copy.title;
            res.locals.description = copy.description || false;
        }

        next();
    };
};
