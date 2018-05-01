'use strict';
const fs = require('fs');
const path = require('path');
const config = require('config');
const { get } = require('lodash');

/**
 * Extract deploy ID from AWS (where provided)
 */
function getDeploymentData() {
    let deploymentData;
    try {
        const pathToManifest = path.join(__dirname, '../config/deploy.json');
        deploymentData = JSON.parse(fs.readFileSync(pathToManifest, 'utf8'));
    } catch (e) {} // eslint-disable-line no-empty
    return deploymentData;
}

const deploymentData = getDeploymentData();
const environment = config.util.getEnv('NODE_ENV'); // Defaults to 'development'

const appData = {
    config: config,
    environment: environment,
    isDev: environment === 'development',
    isNotProduction: environment !== 'production',
    deployId: get(deploymentData, 'deployId', 'DEV'),
    buildNumber: get(deploymentData, 'buildNumber', 'DEV'),
    commitId: get(deploymentData, 'commitId', 'DEV'),
    nodeVersion: process.version
};

module.exports = appData;
