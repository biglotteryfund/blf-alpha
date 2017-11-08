const fs = require('fs');
const path = require('path');
const config = require('config');
const assetVirtualDir = 'assets';

// load cachebusted assets
let assets = {};
try {
    assets = JSON.parse(fs.readFileSync(path.join(__dirname, '../bin/assets.json'), 'utf8'));
} catch (e) {} // eslint-disable-line no-empty

function getCachebustedPath(path) {
    const version = assets.version || 'latest';
    return '/' + [assetVirtualDir, 'build', version, path].join('/');
}

function getRemoteAsset(path) {
    if (path) {
        if (path[0] === '/') {
            path = path.substr(1);
        }
        return `https://${config.get('cloudfrontAssets')}/assets/${path}`;
    }
}

module.exports = {
    assetList: assets,
    assetVirtualDir: assetVirtualDir,
    getCachebustedPath: getCachebustedPath,
    getRemoteAsset: getRemoteAsset
};
