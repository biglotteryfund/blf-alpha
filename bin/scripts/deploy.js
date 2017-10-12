#!/usr/bin/env node

require('dotenv').config();

const has = require('lodash/has');

if (!has(process.env, 'TEST_URL') || !has(process.env, 'PROD_URL')) {
    console.log('Error: TEST_URL and PROD_URL environment variables must be defined');
    process.exit(1);
}

const argv = require('yargs')
    .boolean('l')
    .alias('l', 'live')
    .describe('l', 'Run this command on the live servers')
    .alias('b', 'build')
    .describe('b', 'Pass a custom build number to deploy')
    .help('h')
    .alias('h', 'help').argv;

const prompt = require('prompt');
const AWS = require('aws-sdk');
const rp = require('request-promise');

let customBuildNumber = argv.build;

const codeDeployEnvs = {
    test: {
        applicationName: 'BLF_Test',
        deploymentGroupName: 'BLF_Test_In_Place'
    },
    live: {
        applicationName: 'BLF_Live',
        deploymentGroupName: 'BLF_Live_In_Place'
    }
};

const CONF = {
    s3Bucket: 'blf-travis-test',
    filenamePattern: /build-(\d+).zip/,
    codedeploy: argv.l ? codeDeployEnvs.live : codeDeployEnvs.test,
    githubAccount: 'biglotteryfund',
    githubRepo: 'blf-alpha'
};

// create AWS SDK instance
const credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });
AWS.config.update({ region: 'eu-west-1' });
AWS.config.credentials = credentials;
const codedeploy = new AWS.CodeDeploy();

// do we have a build number?
if (customBuildNumber) {
    lookupRevisionAndDeploy(customBuildNumber); // try to deploy it!
} else {
    // ask for one instead

    // fetch recent revisions from TEST (eg. to promote to live or re-deploy)
    let getRevisions = codedeploy
        .listApplicationRevisions({
            applicationName: codeDeployEnvs.test.applicationName,
            deployed: 'ignore',
            s3Bucket: CONF.s3Bucket,
            sortBy: 'registerTime',
            sortOrder: 'descending'
        })
        .promise();

    // present past revisions to the user
    getRevisions
        .then(data => {
            console.log('Listing the most recent revisions on TEST:\n');
            let revisions = data.revisions.slice(0, 10);
            let validDeploys = [];
            revisions.forEach(r => {
                let id = r.s3Location.key;
                let number = id.match(CONF.filenamePattern);
                if (number && number[1]) {
                    validDeploys.push(parseInt(number[1]));
                    console.log(`\t• Build #${number[1]}`);
                }
            });

            // prompt to ask which revision to deploy
            let promptSchema = {
                description: `\nWhich revision would you like to deploy to ${CONF.codedeploy.applicationName}?`,
                name: 'revisionId',
                type: 'integer',
                message: 'Please supply a valid deploy ID',
                required: true
            };

            prompt.start();

            // deploy a known revision
            prompt.get(promptSchema, (err, result) => {
                let typedId = result.revisionId;
                if (validDeploys.indexOf(typedId) !== -1) {
                    // we know this is valid
                    deployRevision(typedId);
                } else {
                    // not sure about this, look it up
                    console.log("That ID wasn't in the list, looking it up...");
                    lookupRevisionAndDeploy(typedId);
                }
            });
        })
        .catch(err => {
            console.error('Error fetching revisions', {
                error: err
            });
        });
}

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

function getCommitsToBeDeployed() {
    let lookups = [getEnvStatus('test'), getEnvStatus('production')];

    // get server statuses
    return Promise.all(lookups).then(responses => {
        let test = responses[0];
        let prod = responses[1];

        // get the commit IDs
        let ids = {
            test: test.COMMIT_ID,
            prod: prod.COMMIT_ID || 'c54660f391ed5542308d0deb4b87f07ce54ec120' // last build before adding commit_id
        };

        // first commit this returns will be the one currently on TEST
        // @TODO what if we're deploying an older build? no way to save its commit ID in AWS
        let commitList = `https://api.github.com/repos/${CONF.githubAccount}/${CONF.githubRepo}/commits?sha=${ids.test}&per_page=100`;

        // now get commits made before the one currently on TEST
        return rp
            .get({
                url: commitList,
                headers: {
                    'User-Agent': 'BLF-Deploy-Tool'
                }
            })
            .then(response => {
                let commits = JSON.parse(response);
                let commitsToAdd = [];
                // filter out commits made before the last PROD deploy
                for (let i = 0; i < commits.length; i++) {
                    if (commits[i].sha === ids.prod) {
                        break;
                    }
                    commitsToAdd.push(commits[i]);
                }
                return commitsToAdd;
            });
    });
}

// make JSON data for deploy config
function createDeploymentConf(id) {
    return {
        applicationName: CONF.codedeploy.applicationName,
        autoRollbackConfiguration: {
            enabled: true,
            events: ['DEPLOYMENT_FAILURE']
        },
        deploymentConfigName: 'CodeDeployDefault.OneAtATime',
        deploymentGroupName: CONF.codedeploy.deploymentGroupName,
        description: 'Automated deploy',
        fileExistsBehavior: 'OVERWRITE',
        ignoreApplicationStopFailures: false,
        revision: {
            revisionType: 'S3',
            s3Location: {
                bucket: CONF.s3Bucket,
                bundleType: 'zip',
                key: `build-${id}.zip`
            }
        },
        updateOutdatedInstancesOnly: false
    };
}

function verifyCommitsToDeploy() {
    return new Promise((resolve, reject) => {
        return getCommitsToBeDeployed()
            .then(commits => {
                // list the commits
                let commitStr = '';
                console.log('This deployment will push the following commits live:');
                commits.forEach(c => {
                    let line = ` - ${c.commit.message} \n`;
                    commitStr += line;
                    console.log('\t' + line);
                });

                // make sure the user is happy to push these commits
                let promptSchema = {
                    description: `Are you sure you want to push the above commits live?`,
                    name: 'yesno',
                    type: 'string',
                    pattern: /y[es]*|n[o]?/,
                    message: 'Please answer the question properly',
                    required: true
                };

                prompt.start();

                prompt.get(promptSchema, (err, result) => {
                    if (['y', 'yes'].indexOf(result.yesno) !== -1) {
                        resolve('\nThe following commits will be deployed: \n' + commitStr);
                    } else {
                        reject('Bailing out!');
                    }
                });
            })
            .catch(err => {
                reject(err);
            });
    });
}

// trigger the deploy itself
function pushOutDeploy(env, id) {
    let text = `Attempting to deploy revision ${id} to environment ${env}, please wait...`;
    console.log(text);

    const deployParams = createDeploymentConf(id);
    let attemptDeploy = codedeploy.createDeployment(deployParams).promise();
    attemptDeploy
        .then(data => {
            let status = 'Deployment started, monitoring...';
            console.log(status);
            let deployCheck = codedeploy.waitFor('deploymentSuccessful', { deploymentId: data.deploymentId }).promise();
            deployCheck
                .then(() => {
                    let status = 'Deployment succeeded!';
                    console.log(status);
                })
                .catch(err => {
                    console.error('Error deploying revision', {
                        deploymentId: data.deploymentId,
                        error: err
                    });
                });
        })
        .catch(err => {
            console.error('Error creating deployment', {
                buildId: id,
                error: err
            });
        });
}

// do a final check about commits
function deployRevision(id) {
    let env = argv.l ? 'PRODUCTION' : 'TEST';

    // if we're deploying to PROD, look up the commits this will push live
    if (env === 'PRODUCTION') {
        verifyCommitsToDeploy()
            .then(commitStr => {
                pushOutDeploy(env, id, commitStr);
            })
            .catch(err => {
                console.log(err);
                process.exit(1);
            });
    } else {
        // it's a non-prod deploy, no need to verify commits
        pushOutDeploy(env, id);
    }
}

// lookup a known revision on TEST
function getRevision(id) {
    return codedeploy
        .getApplicationRevision({
            applicationName: codeDeployEnvs.test.applicationName,
            revision: {
                revisionType: 'S3',
                s3Location: {
                    bucket: CONF.s3Bucket,
                    bundleType: 'zip',
                    key: `build-${id}.zip`
                }
            }
        })
        .promise();
}

function lookupRevisionAndDeploy(id) {
    getRevision(id)
        .then(() => {
            console.log('Found your revision ID! Deploying it now...');
            deployRevision(id);
        })
        .catch(() => {
            console.error("Error! That ID didn't exist. Sorry :(");
        });
}
