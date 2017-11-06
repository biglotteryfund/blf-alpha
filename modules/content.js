'use strict';
const rp = require('request-promise');
const getSecret = require('./get-secret');

let API_URL = process.env.cmsUrl || getSecret('content-api.url');

if (!API_URL) {
    console.log('Error: CMS_URL endpoint must be defined');
    process.exit(1);
}

function getPromotedNews(locale) {
    return rp({
        url: `${API_URL}/v1/${locale}/promoted-news`,
        json: true
    });
}

function getFundingProgrammes(locale) {
    return rp({
        url: `${API_URL}/v1/${locale}/funding-programmes`,
        json: true
    });
}

module.exports = {
    getPromotedNews,
    getFundingProgrammes
};
