const fs = require('fs');
const path = require('path');
const assetVirtualDir = 'assets';

// load cachebusted assets
let assets = {};
try {
    assets = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/assets.json'), 'utf8'));
} catch (e) {} // eslint-disable-line no-empty

function getCachebustedPath(urlPath, skipVirtualDir) {
    const version = assets.version || 'latest';
    let pathParts = [assetVirtualDir, 'build', version, urlPath];
    if (skipVirtualDir) {
        // Sometimes (eg. email templates) we need the real disk path
        // not the mounted path for web-served static files.
        pathParts = pathParts.slice(1);
    }
    return '/' + pathParts.join('/');
}

function getImagePath(urlPath) {
    if (/^http(s?):\/\//.test(urlPath)) {
        return urlPath;
    } else {
        return '/' + [assetVirtualDir, 'images', urlPath].join('/');
    }
}

module.exports = {
    assetList: assets,
    assetVirtualDir: assetVirtualDir,
    getCachebustedPath: getCachebustedPath,
    getImagePath: getImagePath
};
