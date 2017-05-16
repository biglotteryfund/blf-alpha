"use strict";
const app = require('../server');
const globals = require('./globals');
const config = require('config');
const cacheControl = require('express-cache-controller');

// cache views
app.use(cacheControl({
    maxAge: (globals.get('appData').IS_DEV) ? 0 : config.get('viewCacheExpiration')
}));