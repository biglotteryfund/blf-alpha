'use strict';
const { get, take } = require('lodash');
const request = require('request-promise-native');
const getSecret = require('../modules/get-secret');

const API_URL = process.env.cmsUrl || getSecret('content-api.url');

if (!API_URL) {
    console.log('Error: CMS_URL endpoint must be defined');
    process.exit(1);
}

function getPromotedNews({ locale, limit }) {
    return request({
        url: `${API_URL}/v1/${locale}/promoted-news`,
        json: true
    }).then(response => {
        const data = get(response, 'data', []);
        return limit ? take(data, limit) : data;
    });
}

function getFundingProgrammes({ locale }) {
    return request({
        url: `${API_URL}/v1/${locale}/funding-programmes`,
        json: true
    });
}

function getFundingProgramme({ locale, slug }) {
    return request({
        url: `${API_URL}/v1/${locale}/funding-programme/${slug}`,
        json: true
    }).then(response => get(response, 'data.attributes'));
}

module.exports = {
    getPromotedNews,
    getFundingProgrammes,
    getFundingProgramme
};
