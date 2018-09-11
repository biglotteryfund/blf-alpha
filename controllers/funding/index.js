'use strict';
const materials = require('../materials');

module.exports = ({ router, pages }) => {
    /**
     * Free materials
     */
    router.use(pages.fundingGuidanceMaterials.path, materials(pages.fundingGuidanceMaterials));

    return router;
};
