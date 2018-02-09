const express = require('express');

const routerSetup = require('../setup');
const routeStatic = require('../utils/routeStatic');

const router = express.Router();

module.exports = (pages, sectionPath, sectionId) => {
    routerSetup({
        router,
        pages,
        sectionId
    });

    routeStatic.init({
        router,
        pages,
        sectionPath,
        sectionId
    });

    return router;
};
