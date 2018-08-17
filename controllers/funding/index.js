'use strict';

const landingPageRoute = require('./funding');
const programmesRoute = require('../programmes');
const strategicInvestmentsRoute = require('../strategic-investments');
const tenKRoutes = require('./10k');
const materials = require('../materials');

module.exports = ({ router, pages }) => {
    /**
     * Funding landing page
     */
    landingPageRoute.init({
        router: router,
        routeConfig: pages.root
    });

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
    router.use(pages.fundingGuidanceMaterials.path, materials(pages.fundingGuidanceMaterials));

    return router;
};
