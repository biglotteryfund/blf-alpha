'use strict';
const express = require('express');
const router = express.Router();
const routeStatic = require('../routeStatic');

module.exports = (pages, sectionPath, sectionId) => {
    routeStatic.init({
        router: router,
        pages: pages,
        sectionPath: sectionPath,
        sectionId: sectionId
    });
    return router;
};
