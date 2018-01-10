const fs = require('fs');
const path = require('path');
const assetVirtualDir = 'assets';

// load cachebusted assets
let assets = {};
try {
    assets = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../config/assets.json'), 'utf8')
    );
} catch (e) {} // eslint-disable-line no-empty

function getCachebustedPath(urlPath) {
    const version = assets.version || 'latest';
    return '/' + [assetVirtualDir, 'build', version, urlPath].join('/');
}

function getImagePath(urlPath) {
    return '/' + [assetVirtualDir, 'images', urlPath].join('/');
}

module.exports = {
    assetList: assets,
    assetVirtualDir: assetVirtualDir,
    getCachebustedPath: getCachebustedPath,
    getImagePath: getImagePath
};
