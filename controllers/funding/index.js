'use strict';

const appData = require('../../modules/appData');

const landingPageRoute = require('./funding');
const landingPageNewRoute = require('./funding-new');
const materialsRoute = require('./materials');
const programmesRoute = require('../programmes');
const strategicInvestmentsRoute = require('../strategic-investments');
const tenKRoutes = require('./10k');

module.exports = ({ router, pages }) => {
    /**
     * Funding landing page
     */
    landingPageRoute.init({
        router: router,
        routeConfig: pages.root
    });

    /**
     * Navigation Test: Funding landing page
     */
    if (appData.isNotProduction) {
        router.use('/landing-navigation-test', landingPageNewRoute);
    }

    /**
     * 10k pages
     */
    tenKRoutes.init({
        router: router,
        routeConfigs: pages
    });

    /**
     * Funding programmes
     */
    programmesRoute.init({
        router: router,
        routeConfigs: pages
    });

    /**
     * Strategic investments
     */
    strategicInvestmentsRoute.init({ router });

    /**
     * Free materials
     */
    materialsRoute.init({
        router: router,
        routeConfig: pages.fundingGuidanceMaterials
    });

    return router;
};
