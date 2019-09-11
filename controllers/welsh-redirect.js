'use strict';

const { isWelsh, removeWelsh } = require('../common/urls');

module.exports = function(req, res, next) {
    if (isWelsh(req.originalUrl)) {
        res.redirect(removeWelsh(req.originalUrl));
    } else {
        next();
    }
};
