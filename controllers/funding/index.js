'use strict';
const materials = require('../materials');

module.exports = ({ router, pages }) => {
    router.use('/programmes', require('../programmes'));

    router.use('/funding-finder', require('../funding-finder'));

    /**
     * Free materials
     */
    router.use(pages.fundingGuidanceMaterials.path, materials(pages.fundingGuidanceMaterials));

    return router;
};
