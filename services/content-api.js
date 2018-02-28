const { find, flow, get, getOr, map, take } = require('lodash/fp');
const request = require('request-promise-native');

const mapAttrs = response => map('attributes')(response.data);

let { CONTENT_API_URL } = require('../modules/secrets');

if (!CONTENT_API_URL) {
    console.log('Error: CONTENT_API_URL endpoint must be defined');
    process.exit(1);
}

/**
 * Setter method exposed to aid with tests
 */
function setApiUrl(customApiUrl) {
    CONTENT_API_URL = customApiUrl;
}

/**
 * Getter method exposed to aid with tests
 */
function getApiUrl() {
    return CONTENT_API_URL;
}

/**
 * Adds the preview parameters to the request
 * (if accessed via the preview domain)
 */
function addPreviewParams(previewMode, params) {
    if (!previewMode) {
        return params;
    }

    let previewParams = {};
    previewParams[previewMode.mode] = previewMode.id; // eg. ?draft=123

    return Object.assign({}, previewParams, params);
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
        url: `${CONTENT_API_URL}/v1/${locale}/promoted-news`,
        json: true
    }).then(response => {
        const data = getOr({}, 'data')(response);
        const entries = data.map(entry => entry.attributes);
        return limit ? take(limit)(entries) : entries;
    });
}

function getFundingProgrammes({ locale }) {
    return Promise.all(
        ['en', 'cy'].map(reqLocale => {
            return request({
                url: `${CONTENT_API_URL}/v1/${reqLocale}/funding-programmes`,
                json: true
            });
        })
    ).then(responses => {
        const [enResults, cyResults] = responses.map(mapAttrs);

        if (locale === 'cy') {
            // Replace item with welsh translation if there is one available
            return enResults.map(enItem => {
                const findCy = find(cyItem => cyItem.urlPath === enItem.urlPath);
                return findCy(cyResults) || enItem;
            });
        } else {
            return enResults;
        }
    });
}

function getFundingProgramme({ locale, slug, previewMode }) {
    return request({
        url: `${CONTENT_API_URL}/v1/${locale}/funding-programme/${slug}`,
        json: true,
        qs: addPreviewParams(previewMode)
    }).then(response => {
        const entry = get('data.attributes')(response);
        return entry;
    });
}

function getListingPage({ locale, path, previewMode }) {
    return request({
        url: `${CONTENT_API_URL}/v1/${locale}/listing`,
        qs: addPreviewParams(previewMode, {
            path: path
        }),
        json: true
    }).then(response => {
        const attributes = response.data.map(item => item.attributes);
        const match = attributes.find(_ => _.path === path);
        return match;
    });
}

function getSurveys({ locale = 'en', showAll = false }) {
    let params = {};
    if (showAll) {
        params.all = 'true';
    }
    return request({
        url: `${CONTENT_API_URL}/v1/${locale}/surveys`,
        qs: params,
        json: true
    }).then(response => {
        return response.data.map(item => {
            let data = item.attributes;
            data.id = parseInt(item.id);
            return data;
        });
    });
}

function getProfiles({ locale, section }) {
    return request({
        url: `${CONTENT_API_URL}/v1/${locale}/profiles/${section}`,
        json: true
    }).then(response => mapAttrs(response));
}

function getRoutes() {
    return request({
        url: `${CONTENT_API_URL}/v1/list-routes`,
        json: true
    }).then(response => mapAttrs(response));
}

module.exports = {
    setApiUrl,
    getApiUrl,
    getCmsPath,
    getPromotedNews,
    getFundingProgrammes,
    getFundingProgramme,
    getListingPage,
    getProfiles,
    getSurveys,
    getRoutes
};
