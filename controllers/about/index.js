'use strict';
const express = require('express');

const routerSetup = require('../setup');
const routeStatic = require('../utils/routeStatic');
const ebulletinRoute = require('./ebulletin');

const router = express.Router();

module.exports = (pages, sectionPath, sectionId) => {
    routerSetup({
        router,
        pages,
        sectionId
    });

    ebulletinRoute.init({
        router: router,
        routeConfig: pages.ebulletin,
        sectionPath: sectionPath
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
