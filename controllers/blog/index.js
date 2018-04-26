'use strict';
const express = require('express');

const routerSetup = require('../setup');
const routeCommon = require('../common');

module.exports = (pages, sectionPath, sectionId) => {
    const router = express.Router();

    routerSetup({
        router,
        pages,
        sectionId
    });

    routeCommon.init({
        router: router,
        pages: pages,
        sectionPath: sectionPath,
        sectionId: sectionId
    });

    return router;
};
