'use strict';

const express = require('express');

const routeStatic = require('../utils/routeStatic');
const materialsRoute = require('./materials');
const programmesRoute = require('./programmes');

const router = express.Router();

module.exports = (pages, sectionPath, sectionId) => {
    /**
     * Populate static pages
     */
    routeStatic.initRouting(pages, router, sectionPath, sectionId);

    /**
     * Free materials
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
        routeConfig: {
            programmes: pages.programmes,
            programmeDetail: pages.programmeDetail,
            programmeDetailAfaEngland: pages.programmeDetailAfaEngland
        }
    });

    return router;
};
