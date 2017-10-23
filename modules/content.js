'use strict';
const rp = require('request-promise');
const secrets = require('./secrets');

let CMS_URL = secrets['cms.url'] || process.env.cmsUrl;
if (!CMS_URL) {
    console.log('Error: CMS_URL endpoint must be defined');
    process.exit(1);
}

const getFundingProgrammes = locale => {
    return rp({
        url: `${CMS_URL}/api/v1/${locale}/funding-programmes`,
        json: true
    });
};

module.exports = {
    getFundingProgrammes
};
