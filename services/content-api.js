const { get, take } = require('lodash');
const request = require('request-promise-native');
const { getSecret } = require('../modules/secrets');

const API_URL = process.env.CONTENT_API_URL || getSecret('content-api.url');

if (!API_URL) {
    console.log('Error: API_URL endpoint must be defined');
    process.exit(1);
}

/**
 * Get CMS Path
 * Returns sanitised pagePath for top-level sections
 * otherwise prepends sectionId to pagePath
 */
function getCmsPath(sectionId, pagePath) {
    return sectionId === 'toplevel' ? pagePath.replace(/^\/+/g, '') : `${sectionId}${pagePath}`;
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

function getLegacyPage({ locale, path }) {
    return request({
        url: `${API_URL}/v1/${locale}/legacy`,
        qs: {
            path: path
        },
        json: true
    }).then(response => {
        return get(response, 'data.attributes');
    });
}

function getListingPage({ locale, path }) {
    return request({
        url: `${API_URL}/v1/${locale}/listing`,
        qs: {
            path: path
        },
        json: true
    }).then(response => {
        return response.data.map(item => item.attributes).find(_ => _.path === path);
    });
}

module.exports = {
    getCmsPath,
    getPromotedNews,
    getFundingProgrammes,
    getFundingProgramme,
    getLegacyPage,
    getListingPage
};
