'use strict';
const rp = require('request-promise');
const has = require('lodash/has');
require('dotenv').config();

if (!has(process.env, 'CMS_URL')) {
    console.log('Error: CMS_URL environment variable must be defined');
    process.exit(1);
}

const API_URL = process.env.CMS_URL + '/content/';

const getFundingProgrammes = locale => {
    return rp({
        url: API_URL + locale + '/programs.json',
        json: true
    });
};

module.exports = {
    getFundingProgrammes
};
