'use strict';
const rp = require('request-promise');
const secrets = require('./secrets');

let CMS_URL = secrets['cms.url'] || process.env.cmsUrl;
if (!CMS_URL) {
    console.log('Error: CMS_URL endpoint must be defined');
    process.exit(1);
}

const API_URL = CMS_URL + '/content/';

const getFundingProgrammes = locale => {
    return rp({
        url: API_URL + locale + '/programs.json',
        json: true
    });
};

module.exports = {
    getFundingProgrammes
};
