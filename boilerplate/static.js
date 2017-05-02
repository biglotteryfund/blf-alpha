"use strict";
const assets = require('../assets');
const express = require('express');
const path = require('path');
const config = require('config');

module.exports = function (app) {
    // configure static files
    app.use('/' + assets.assetVirtualDir, express.static(path.join(__dirname, '../public'), {
        maxAge: config.get('staticExpiration')
    }));
};