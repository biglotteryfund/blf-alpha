'use strict';
const express = require('express');

const { shouldServe } = require('../../modules/pageLogic');
const routeCommon = require('../common');
const routerSetup = require('../setup');

const landingRoute = require('./landing');

module.exports = (pages, sectionPath, sectionId) => {
    const router = express.Router();

    routerSetup({
        router,
        pages,
        sectionId
    });

    if (shouldServe(pages.root)) {
        landingRoute.init({
            router: router,
            routeConfig: pages.root
        });
    }

    routeCommon.init({
        router: router,
        pages: pages,
        sectionPath: sectionPath,
        sectionId: sectionId
    });

    return router;
};
