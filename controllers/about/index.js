'use strict';
const express = require('express');
const router = express.Router();
const routeStatic = require('../utils/routeStatic');

module.exports = (pages, sectionPath, sectionId) => {
    /**
     * 1. Populate static pages
     */
    routeStatic.initRouting(pages, router, sectionPath, sectionId);

    return router;
};
