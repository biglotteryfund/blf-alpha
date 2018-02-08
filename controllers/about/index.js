'use strict';
const express = require('express');
const router = express.Router();

const routeStatic = require('../utils/routeStatic');
const addSection = require('../../middleware/addSection');
const ebulletinRoute = require('./ebulletin');

module.exports = (pages, sectionPath, sectionId) => {
    router.use(addSection(sectionId));

    routeStatic.init({
        router: router,
        pages: pages,
        sectionPath: sectionPath,
        sectionId: sectionId
    });

    ebulletinRoute.init({
        router: router,
        routeConfig: pages.ebulletin,
        sectionPath: sectionPath
    });

    return router;
};
