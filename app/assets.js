const fs = require('fs');
const assetVirtualDir = '';

// load cachebusted assets
let assets = {};
try {
    assets = JSON.parse(
        fs.readFileSync(__dirname + '/assets/assets.json', 'utf8')
    );
} catch (e) {
    console.info('assets.json not found -- are you in DEV mode?');
}

// function for templates
const getCachebustedPath = function (path) {
    const isCachebusted = assets[path];
    const p = (isCachebusted) ? isCachebusted : path;
    return assetVirtualDir + '/' + p;
};

module.exports = {
    assetList: assets,
    assetVirtualDir: assetVirtualDir,
    getCachebustedPath: getCachebustedPath
};