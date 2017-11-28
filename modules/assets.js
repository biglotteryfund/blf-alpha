const fs = require('fs');
const path = require('path');
const assetVirtualDir = 'assets';

// load cachebusted assets
let assets = {};
try {
    assets = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/assets.json'), 'utf8'));
} catch (e) {} // eslint-disable-line no-empty

function getCachebustedPath(path) {
    const version = assets.version || 'latest';
    return '/' + [assetVirtualDir, 'build', version, path].join('/');
}

function getImagePath(path) {
    return '/' + [assetVirtualDir, 'images', path].join('/');
}

module.exports = {
    assetList: assets,
    assetVirtualDir: assetVirtualDir,
    getCachebustedPath: getCachebustedPath,
    getImagePath: getImagePath
};
