'use strict';
const ebulletinRoute = require('./ebulletin');
const profilesRoutes = require('./profiles');

module.exports = ({ router, pages }) => {
    ebulletinRoute.init({
        router: router,
        routeConfig: pages.ebulletin
    });

    profilesRoutes.init({
        router: router,
        routeConfigs: pages
    });

    return router;
};
