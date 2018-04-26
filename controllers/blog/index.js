'use strict';

const express = require('express');

const { shouldServe } = require('../../modules/pageLogic');

const landingRouter = require('./landing');
const articlesRouter = require('./articles');

module.exports = (pages, sectionPath) => {
    const router = express.Router();

    if (shouldServe(pages.root)) {
        landingRouter.init({
            router: router,
            routeConfig: pages.root
        });

        articlesRouter.init({
            router: router,
            routeConfig: pages.articles,
            sectionPath: sectionPath
        });
    }

    return router;
};
