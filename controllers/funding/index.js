'use strict';

const express = require('express');

const routeStatic = require('../routeStatic');
const programmesRoute = require('./programmes');
const materialsRoute = require('./materials');

const router = express.Router();

module.exports = (pages, sectionPath, sectionId) => {
    /**
     * Order Free Materials
     */
    materialsRoute.init({
        router: router,
        routeConfig: pages.freeMaterials
    });

    /**
     * Funding programmes
     */
    programmesRoute.init({
        router: router,
        config: {
            listing: pages.programmes,
            detail: pages.programmeDetail
        }
    });

    /**
     * Populate static pages
     * Must come last to allow custom routes to take precedence over wildcards
     */
    routeStatic.init({
        router: router,
        pages: pages,
        sectionPath: sectionPath,
        sectionId: sectionId
    });

    return router;
};
