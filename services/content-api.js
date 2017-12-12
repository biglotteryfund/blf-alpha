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
        const entries = data.map(entry => entry.attributes);
        return limit ? take(entries, limit) : entries;
    });
}

function getFundingProgrammes({ locale }) {
    return request({
        url: `${API_URL}/v1/${locale}/funding-programmes`,
        json: true
    }).then(response => {
        const programmes = response.data.map(item => item.attributes);
        return programmes;
    });
}

function getFundingProgramme({ locale, slug }) {
    return request({
        url: `${API_URL}/v1/${locale}/funding-programme/${slug}`,
        json: true
    }).then(response => {
        const entry = get(response, 'data.attributes');
        return entry;
    });
}

module.exports = {
    getPromotedNews,
    getFundingProgrammes,
    getFundingProgramme
};
