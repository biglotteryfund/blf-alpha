'use strict';

const { execSync } = require('child_process');
const isProduction = process.env.NODE_ENV === 'production';

function getBuildSummary() {
    const commitHash = execSync('git rev-parse --short=12 HEAD')
        .toString()
        .trim();

    const cssInDir = './assets/sass';

    const manifestDir = './config/assets.json';

    const buildVersion = isProduction ? commitHash : 'latest';

    const buildDirBase = './public/build';
    const buildDir = `${buildDirBase}/${buildVersion}`;

    const publicDirBase = '/public/build';
    const publicDir = `${publicDirBase}/${buildVersion}`;

    return {
        isProduction,
        commitHash,
        cssInDir,
        manifestDir,
        buildVersion,
        buildDirBase,
        buildDir,
        publicDirBase,
        publicDir
    };
}

module.exports = {
    getBuildSummary
};
