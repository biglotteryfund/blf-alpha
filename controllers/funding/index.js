'use strict';

const programmesRoute = require('../programmes');
const materials = require('../materials');

module.exports = ({ router, pages }) => {
    /**
     * Funding programmes
     */
    programmesRoute.init({
        router: router,
        routeConfigs: pages
    });

    /**
     * Free materials
     */
    router.use(pages.fundingGuidanceMaterials.path, materials(pages.fundingGuidanceMaterials));

    return router;
};
