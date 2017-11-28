const fs = require('fs');
const path = require('path');
const config = require('config');

// extract deploy ID from AWS (where provided)
let deploymentData;
try {
    deploymentData = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/deploy.json'), 'utf8'));
} catch (e) {
    // console.info('deploy.json not found -- are you in DEV mode?');
}

const appEnv = process.env.NODE_ENV || 'development';
const appData = {
    nodeVersion: process.version,
    deployId: deploymentData && deploymentData.deployId ? deploymentData.deployId : 'DEV',
    buildNumber: deploymentData && deploymentData.buildNumber ? deploymentData.buildNumber : 'DEV',
    commitId: deploymentData && deploymentData.commitId ? deploymentData.commitId : 'DEV',
    IS_DEV: appEnv === 'development',
    environment: appEnv,
    config: config
};

module.exports = appData;
