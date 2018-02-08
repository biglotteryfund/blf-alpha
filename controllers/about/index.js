'use strict';
const express = require('express');
const router = express.Router();

const ebulletinRoute = require('./ebulletin');
const routeStatic = require('../utils/routeStatic');
const addSection = require('../../middleware/addSection');

module.exports = (pages, sectionPath, sectionId) => {
    router.use(addSection(sectionId));

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
