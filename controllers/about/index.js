'use strict';
const express = require('express');
const router = express.Router();
const routeStatic = require('../utils/routeStatic');
const addSection = require('../../middleware/addSection');

module.exports = (pages, sectionPath, sectionId) => {
    router.use(addSection(sectionId));

    routeStatic.init({
        router: router,
        pages: pages,
        sectionPath: sectionPath,
        sectionId: sectionId
    });
    return router;
};
