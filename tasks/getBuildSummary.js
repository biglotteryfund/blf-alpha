'use strict';

const isProduction = process.env.NODE_ENV === 'production';

const commitHash = require('child_process')
    .execSync('git rev-parse --short HEAD')
    .toString()
    .trim();

const buildVersion = isProduction ? commitHash : 'latest';

const buildDirBase = './public/build';
const buildDir = `${buildDirBase}/${buildVersion}`;

const publicDirBase = '/assets/build';
const publicDir = `${publicDirBase}/${buildVersion}`;

module.exports = function() {
    return {
        isProduction,
        commitHash,
        buildVersion,
        buildDirBase,
        buildDir,
        publicDirBase,
        publicDir
    };
};
