const fs = require('fs');
const path = require('path');
const config = require('config');
const appData = require('../modules/appData');

// load cachebusted assets
let assets = {};
try {
    assets = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/assets.json'), 'utf8'));
} catch (e) {} // eslint-disable-line no-empty

const ASSET_VIRTUAL_DIR = config.get('assetVirtualDir');
const CURRENT_VERSION = assets.version || 'latest';

function getCachebustedPath(urlPath) {
    const baseUrl = appData.isDev ? `/${ASSET_VIRTUAL_DIR}` : 'https://media.biglotteryfund.org.uk/';
    return `${baseUrl}/build/${CURRENT_VERSION}/${urlPath}`;
}

function getCachebustedRealPath(urlPath) {
    return `/build/${CURRENT_VERSION}/${urlPath}`;
}

function getImagePath(urlPath) {
    if (/^http(s?):\/\//.test(urlPath)) {
        return urlPath;
    } else {
        return `/${ASSET_VIRTUAL_DIR}/images/${urlPath}`;
    }
}

module.exports = {
    getCachebustedPath: getCachebustedPath,
    getCachebustedRealPath: getCachebustedRealPath,
    getImagePath: getImagePath
};
