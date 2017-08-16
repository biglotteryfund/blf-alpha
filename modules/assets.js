const fs = require('fs');
const path = require('path');
const assetVirtualDir = 'assets';

// load cachebusted assets
let assets = {};
try {
    assets = JSON.parse(fs.readFileSync(path.join(__dirname, '../bin/assets.json'), 'utf8'));
} catch (e) {
    // console.info('assets.json not found -- are you in DEV mode?');
}

// function for templates
const getCachebustedPath = (path) => {
    const isCachebusted = assets[path];
    const p = (isCachebusted) ? isCachebusted : path;
    return '/' + assetVirtualDir + '/' + p;
};

module.exports = {
    assetList: assets,
    assetVirtualDir: assetVirtualDir,
    getCachebustedPath: getCachebustedPath
};