'use strict';
const express = require('express');
const router = express.Router();
const routeStatic = require('./routeStatic');

module.exports = (pages) => {

    /**
     * 1. Populate static pages
     */
    for (let page in pages) {
        if (pages[page].static) { routeStatic(pages[page], router); }
    }

    return router;
};