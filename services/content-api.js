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

function fetch(urlPath, options) {
    const defaults = {
        url: `${CONTENT_API_URL}${urlPath}`,
        json: true
    };
    const params = Object.assign({}, defaults, options);
    return request(params);
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
    return fetch(`/v1/${locale}/promoted-news`).then(response => {
        const data = getOr({}, 'data')(response);
        const entries = data.map(entry => entry.attributes);
        return limit ? take(limit)(entries) : entries;
    });
}

function getFundingProgrammes({ locale }) {
    const promises = ['en', 'cy'].map(reqLocale => fetch(`/v1/${reqLocale}/funding-programmes`));
    return Promise.all(promises).then(responses => {
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
    return fetch(`/v1/${locale}/funding-programme/${slug}`, {
        qs: addPreviewParams(previewMode)
    }).then(response => {
        const entry = get('data.attributes')(response);
        return entry;
    });
}

function getListingPage({ locale, path, previewMode }) {
    return fetch(`/v1/${locale}/listing`, {
        qs: addPreviewParams(previewMode, { path })
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

    return fetch(`/v1/${locale}/surveys`, { qs: params }).then(response => {
        return response.data.map(item => {
            let data = item.attributes;
            data.id = parseInt(item.id);
            return data;
        });
    });
}

function getProfiles({ locale, section }) {
    return fetch(`/v1/${locale}/profiles/${section}`).then(mapAttrs);
}

function getRoutes() {
    return fetch('/v1/list-routes').then(mapAttrs);
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
