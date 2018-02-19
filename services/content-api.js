const { get, take, sortedUniq } = require('lodash');
const request = require('request-promise-native');
const { getSecret } = require('../modules/secrets');

let API_URL = process.env.CONTENT_API_URL || getSecret('content-api.url');

if (!API_URL) {
    console.log('Error: API_URL endpoint must be defined');
    process.exit(1);
}

/**
 * Setter method exposed to aid with tests
 */
function setApiUrl(customApiUrl) {
    API_URL = customApiUrl;
}

/**
 * Getter method exposed to aid with tests
 */
function getApiUrl() {
    return API_URL;
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
        const attributes = response.data.map(item => item.attributes);
        const match = attributes.find(_ => _.path === path);

        if (match) {
            const exampleCaseStudy = {
                title: 'Darren’s Story',
                trailText:
                    '<p>Darren Murinas is an expert citizen for <a href="http://www.voicesofstoke.org.uk/">Voices</a>, the Stoke partnership supporting people with multiple needs.</p>',
                trailTextMore: 'Read Darren’s Story…',
                thumbnailUrl: 'https://via.placeholder.com/600x339.jpg?text=Placeholder',
                linkUrl: 'https://www.biglotteryfund.org.uk/about-big/strategic-framework/sfengcasestudy'
            };

            match.caseStudies = [exampleCaseStudy, exampleCaseStudy, exampleCaseStudy];
        }

        return match;
    });
}

function getRoutes() {
    return request({
        url: `${API_URL}/v1/list-routes`,
        json: true
    }).then(response => {
        return response.data.map(item => item.attributes);
    });
}

module.exports = {
    setApiUrl,
    getApiUrl,
    getCmsPath,
    getPromotedNews,
    getFundingProgrammes,
    getFundingProgramme,
    getLegacyPage,
    getListingPage,
    getRoutes
};
