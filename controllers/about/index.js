'use strict';
const express = require('express');

const routerSetup = require('../setup');
const routeCommon = require('../common');
const ebulletinRoute = require('./ebulletin');
const seniorManagementRoute = require('./seniorManagement');

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

    seniorManagementRoute.init({
        router: router,
        routeConfig: pages.seniorManagement
    });

    routeCommon.init({
        router: router,
        pages: pages,
        sectionPath: sectionPath,
        sectionId: sectionId
    });

    return router;
};
