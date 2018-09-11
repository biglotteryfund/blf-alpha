'use strict';
const ebulletinRoute = require('./ebulletin');

module.exports = ({ router, pages }) => {
    ebulletinRoute.init({
        router: router,
        routeConfig: pages.ebulletin
    });

    return router;
};
