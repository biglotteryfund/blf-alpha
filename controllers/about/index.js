'use strict';
const routeCommon = require('../common');
const ebulletinRoute = require('./ebulletin');
const seniorManagementRoute = require('./seniorManagement');
const boardRoute = require('./boardRoute');
const { shouldServe } = require('../../modules/pageLogic');

module.exports = (router, pages, sectionPath, sectionId) => {
    ebulletinRoute.init({
        router: router,
        routeConfig: pages.ebulletin
    });

    if (shouldServe(pages.seniorManagement)) {
        seniorManagementRoute.init({
            router: router,
            routeConfig: pages.seniorManagement
        });
    }

    if (shouldServe(pages.board)) {
        boardRoute.init({
            router: router,
            routeConfig: pages.board
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
