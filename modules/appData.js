const fs = require('fs');
const path = require('path');
const config = require('config');
const { get } = require('lodash');

/**
 * Extract deploy ID from AWS (where provided)
 */
let deploymentData;
try {
    deploymentData = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/deploy.json'), 'utf8'));
} catch (e) {} // eslint-disable-line no-empty

const appEnv = config.util.getEnv('NODE_ENV');

const appData = {
    config: config,
    environment: appEnv,
    isDev: appEnv === 'development',
    nodeVersion: process.version,
    deployId: get(deploymentData, 'deployId', 'DEV'),
    buildNumber: get(deploymentData, 'buildNumber', 'DEV'),
    commitId: get(deploymentData, 'commitId', 'DEV')
};

module.exports = appData;
