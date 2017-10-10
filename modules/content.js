'use strict';
const rp = require('request-promise');

const API_URL = 'http://craft3.dev/content/';

const getFundingProgrammes = locale => {
    return rp({
        url: API_URL + locale + '/programs.json',
        json: true
    });
};

module.exports = {
    getFundingProgrammes
};
