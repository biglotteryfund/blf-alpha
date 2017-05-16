"use strict";
const app = require('../server');
const assets = require('../assets');
const express = require('express');
const path = require('path');
const config = require('config');

// configure static files
app.use('/' + assets.assetVirtualDir, express.static(path.join(__dirname, '../public'), {
    maxAge: config.get('staticExpiration')
}));