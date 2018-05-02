'use strict';

const express = require('express');

const routerSetup = require('../setup');
const routeCommon = require('../common');

const landingPageRoute = require('./funding');
const materialsRoute = require('./materials');
const programmesRoute = require('./programmes');
const pastGrantsRoute = require('./past-grants');
const tenKRoutes = require('./10k');

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
     * 10k pages
     */
    tenKRoutes.init({
        router: router,
        under10kConfig: pages.under10k,
        over10kConfig: pages.over10k
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
            programmeDetailAfaEngland: pages.programmeDetailAfaEngland,
            programmeDetailAfaWales: pages.programmeDetailAfaWales,
            programmeDetailAfaScotland: pages.programmeDetailAfaScotland
        }
    });

    /**
     * Past Grants
     */
    pastGrantsRoute.init({
        router: router,
        routeConfig: pages.pastGrants
    });

    routeCommon.init({
        router: router,
        pages: pages,
        sectionPath: sectionPath,
        sectionId: sectionId
    });

    return router;
};
