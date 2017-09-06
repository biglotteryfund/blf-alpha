'use strict';
const express = require('express');
const router = express.Router();
const routeStatic = require('../utils/routeStatic');

module.exports = (pages, sectionId) => {

    /**
     * 1. Populate static pages
     */
    routeStatic.initRouting(pages, router, sectionId);

    return router;
};