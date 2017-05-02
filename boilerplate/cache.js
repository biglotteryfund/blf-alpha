"use strict";
const config = require('config');
const cacheControl = require('express-cache-controller');

module.exports = function (app) {
    // cache views
    app.use(cacheControl({
        maxAge: (app.locals.IS_DEV) ? 0 : config.get('viewCacheExpiration')
    }));
};