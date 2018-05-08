'use strict';
const ebulletinRoute = require('./ebulletin');
const seniorManagementRoute = require('./seniorManagement');
const boardRoute = require('./boardRoute');
const { shouldServe } = require('../../modules/pageLogic');

module.exports = ({ router, pages }) => {
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

    return router;
};
