'use strict';
const appData = require('../../../common/appData');
const { getParameter } = require('../../../common/parameter-store');

const { Client } = require('@ideal-postcodes/core-node');
const postcodesClient = new Client({
    api_key: process.env.POSTCODES_API_KEY || getParameter('postcodes.api.key')
});

/**
 * lookupPostcode
 * wrapper around ideal-postcodes API
 * @param postcode
 * @returns {Promise<[]>}
 */
module.exports = function(postcode) {
    /**
     * Tag the postcode lookup with metadata for reporting
     */
    const tags = [`ENV_${appData.environment}`, `BUILD_${appData.buildNumber}`];
    return postcodesClient.lookupPostcode({ postcode, tags });
};
