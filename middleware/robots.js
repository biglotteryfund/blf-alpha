'use strict';

function noindex(req, res, next) {
    res.setHeader('X-Robots-Tag', 'noindex');
    next();
}

module.exports = {
    noindex
};
