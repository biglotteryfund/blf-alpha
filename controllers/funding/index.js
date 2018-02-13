'use strict';

const express = require('express');

const routerSetup = require('../setup');
const routeStatic = require('../utils/routeStatic');
const landingPageRoute = require('./funding');
const materialsRoute = require('./materials');
const programmesRoute = require('./programmes');

const router = express.Router();

module.exports = (pages, sectionPath, sectionId) => {
    routerSetup({
        router,
        pages,
        sectionId
    });

    /**
     * Funding landing page
     */
    landingPageRoute.init({
        router: router,
        routeConfig: pages.root
    });

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
