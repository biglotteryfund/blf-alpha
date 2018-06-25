'use strict';

const landingPageRoute = require('./grants');

module.exports = ({ router, pages }) => {
    /**
     * Grants landing page
     */
    landingPageRoute.init({
        router: router,
        routeConfig: pages.root
    });

    return router;
};
