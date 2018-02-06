'use strict';

const express = require('express');

const routeStatic = require('../utils/routeStatic');
const landingPageRoute = require('./funding');
const materialsRoute = require('./materials');
const programmesRoute = require('./programmes');
const { redirectArchived } = require('../../modules/legacy');
const { noCache } = require('../../middleware/cached');

const router = express.Router();

module.exports = (pages, sectionPath, sectionId) => {
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
     * Applying for funding (Archived)
     */
    router.get(pages.applyingForFunding.path, noCache, redirectArchived);

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
