#!/usr/bin/env node
'use strict';

const prompt = require('prompt');
const _ = require('lodash');
const path = require('path');
const AWS = require('aws-sdk');
const fs = require('fs');
const moment = require('moment');
const rp = require('request-promise');
const has = require('lodash/has');
require('dotenv').config();

const argv = require('yargs')
    .boolean('l')
    .alias('l', 'live')
    .describe('l', 'Run this command against the live distribution')
    .alias('f', 'file')
    .describe('f', 'Pass an existing config to apply (eg. restore a backup)')
    .alias('c', 'commit')
    .describe('c', 'A commit hash to use as a reference for the config file')
    .help('h')
    .alias('h', 'help').argv;

const IS_LIVE = argv.l;

if (!has(process.env, 'TEST_URL') || !has(process.env, 'PROD_URL')) {
    console.log('Error: TEST_URL and PROD_URL environment variables must be defined');
    process.exit(1);
}

// are we restoring an old config?
let customConfig;
if (argv.file) {
    try {
        customConfig = JSON.parse(fs.readFileSync(argv.file, 'utf8'));
    } catch (err) {
        console.error('Could not read supplied config file');
        process.exit(1);
    }
}

// get server statuses for app environments
function getEnvStatus(env) {
    const URLs = {
        test: process.env.TEST_URL,
        production: process.env.PROD_URL
    };

    return rp({
        url: URLs[env] + '/status'
    }).then(response => {
        return JSON.parse(response);
    });
}

const configFilename = IS_LIVE ? 'live' : 'test';
const configPath = `bin/cloudfront/${configFilename}.js`;
const CONFIG_URL = `https://api.github.com/repos/biglotteryfund/blf-alpha/contents/${configPath}`;

// get the current commit IDs
getEnvStatus(IS_LIVE ? 'production' : 'test')
    .then(status => {
        // look up the file at the chosen environment's current commit
        let routesParams = {
            ref: status.COMMIT_ID
        };

        // use a custom commit, if supplied
        if (argv.c) {
            routesParams.ref = argv.c;
        }

        console.log(`Fetching "${configFilename}" config file for commit ${routesParams.ref}`);

        // fetch the routes file details
        rp({
            url: CONFIG_URL,
            qs: routesParams,
            headers: {
                'User-Agent': 'BLF-Cloudfront-Tool'
            }
        })
            .then(response => {
                let json = JSON.parse(response);
                let filePath = json.download_url;
                console.log(`Got the file data, downloading content from ${filePath}...`);

                // now fetch the file content itself
                rp({
                    url: filePath
                })
                    .then(fileContent => {
                        console.log(`Fetched file content, parsing...`);
                        beginUpdate(fileContent);
                    })
                    .catch(err => {
                        console.log(`Error getting "${configFilename}" config file content`, {
                            error: err
                        });
                    });
            })
            .catch(err => {
                console.log(`Error getting "${configFilename}" config file data`, {
                    error: err
                });
            });
    })
    .catch(err => {
        console.log('Failed to fetch server status');
    });

const beginUpdate = routesFileContent => {
    let configData;

    try {
        configData = eval(routesFileContent);
        console.log(`Succeeded in parsing "${configFilename}" config file content, continuing...`);
    } catch (err) {
        console.error('Could not read downloaded routes file');
        process.exit(1);
    }

    // create AWS SDK instance
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });
    const cloudfront = new AWS.CloudFront();

    // configure cloudfront-specific items here
    // @TODO share this with other script
    const CF_CONFIGS = {
        test: {
            distributionId: 'E3D5QJTWAG3GDP',
            origins: {
                newSite: 'ELB-TEST'
            }
        },
        live: {
            distributionId: 'E2WYWBLMWIN5U1',
            origins: {
                legacy: 'Custom-www.biglotteryfund.org.uk',
                newSite: 'ELB_LIVE'
            }
        }
    };

    // decide which config to use (pass --live to this script to use live)
    const cloudfrontDistribution = IS_LIVE ? CF_CONFIGS.live : CF_CONFIGS.test;

    // get existing cloudfront config
    const getDistributionConfig = cloudfront
        .getDistribution({
            Id: cloudfrontDistribution.distributionId
        })
        .promise();

    // handle response from fetching config
    getDistributionConfig
        .then(data => {
            // fetching the config worked

            let newConfigToWrite = configData;

            // store the existing config locally, just in case...
            const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
            const confPath = path.join(__dirname, `../cloudfront/backup/${timestamp}.json`);
            const confData = JSON.stringify(data, null, 4);

            // write existing config to file for backup
            try {
                fs.writeFileSync(confPath, confData);
                console.log('A copy of the existing config was saved in ' + confPath);
            } catch (err) {
                return console.error('Error saving old config', err);
            }

            // store etag for later update
            const etag = data.ETag;

            // are we using a custom config (eg. a backup file)?
            if (customConfig) {
                newConfigToWrite = customConfig;
            }

            // allow for diff/comparison before deploy
            const getUrls = item => {
                // add a leading slash for comparison's sake
                let path = item.PathPattern;
                if (path[0] !== '/') {
                    path = '/' + path;
                }
                return {
                    path: path,
                    origin: item.TargetOriginId
                };
            };

            // verify what's being changed
            const paths = {
                before: data.Distribution.DistributionConfig.CacheBehaviors.Items.map(getUrls),
                after: newConfigToWrite.Distribution.DistributionConfig.CacheBehaviors.Items.map(getUrls)
            };
            const pathsAdded = _.filter(paths.after, obj => !_.find(paths.before, obj));
            const pathsRemoved = _.filter(paths.before, obj => !_.find(paths.after, obj));

            // warn users about changes
            console.log(
                'There are currently ' +
                    data.Distribution.DistributionConfig.CacheBehaviors.Quantity +
                    ' items in the existing behaviours, and ' +
                    newConfigToWrite.Distribution.DistributionConfig.CacheBehaviors.Quantity +
                    ' in this one.'
            );

            if (pathsRemoved.length) {
                console.log('The following paths will be removed from Cloudfront:', {
                    paths: pathsRemoved
                });
            }

            if (pathsAdded.length) {
                console.log('The following paths will be added to Cloudfront:', {
                    paths: pathsAdded
                });
            }

            // prompt to confirm change
            let promptSchema = {
                description: `Are you sure you want to make this change to ${cloudfrontDistribution.distributionId}?`,
                name: 'yesno',
                type: 'string',
                pattern: /y[es]*|n[o]?/,
                message: 'Please answer the question properly',
                required: true
            };

            prompt.start();

            prompt.get(promptSchema, (err, result) => {
                if (err) {
                    console.log('Bailing out!');
                    process.exit(1);
                } else if (['y', 'yes'].indexOf(result.yesno) !== -1) {
                    console.log('Starting update...');

                    // try to update the distribution
                    let updateDistributionConfig = cloudfront
                        .updateDistribution({
                            DistributionConfig: newConfigToWrite,
                            Id: cloudfrontDistribution.distributionId,
                            IfMatch: etag
                        })
                        .promise();

                    // respond to update change
                    updateDistributionConfig
                        .then(data => {
                            // the update worked
                            console.log(data);
                            console.log('CloudFront was successfully updated with the new configuration!');
                        })
                        .catch(err => {
                            // failed to update config
                            console.log(JSON.stringify(newConfigToWrite));
                            console.error('There was an error uploading this config', {
                                error: err
                            });
                        });
                } else {
                    console.log('Bailing out!');
                    process.exit(1);
                }
            });
        })
        .catch(err => {
            // failed to get config
            console.error('There was an error fetching the config', {
                error: err
            });
        });
};
