'use strict';
const express = require('express');

const routerSetup = require('../setup');
const routeCommon = require('../common');

const router = express.Router();

module.exports = (pages, sectionPath, sectionId) => {
    routerSetup({
        router,
        pages,
        sectionId
    });

    routeCommon.init({
        router,
        pages,
        sectionPath,
        sectionId
    });

    return router;
};
