#!/usr/bin/env node
'use strict';
const argv = require('yargs')
    .boolean('l')
    .alias('l', 'live')
    .describe('l', 'Run this command against the live distribution')
    .alias('f', 'file')
    .describe('f', 'Pass an existing config to apply (eg. restore a backup)')
    .help('h')
    .alias('h', 'help')
    .argv;
const prompt = require('prompt');
const routes = require('../../controllers/routes');
const utilities = require('../../modules/utilities');
const _ = require('lodash');
const path = require('path');
const AWS = require('aws-sdk');
const fs = require('fs');
const moment = require('moment');
const config = require('config');

let customConfig;
if (argv.file) {
    try {
        customConfig = JSON.parse(fs.readFileSync(argv.file, 'utf8'));
    } catch (err) {
        console.error('Could not read supplied config file');
        process.exit(1);
    }
}

// create AWS SDK instance
const credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });
AWS.config.credentials = credentials;
const cloudfront = new AWS.CloudFront();

// configure cloudfront-specific items here
const CF_CONFIGS = {
    test: {
        distributionId: 'E3D5QJTWAG3GDP',
        origins: {
            legacy: 'ELB-TEST',
            newSite: 'ELB-LIVE',
            smallGrants: 'ELB-TEST',
            smallGrantsTest: 'ELB-TEST'
        }
    },
    live: {
        distributionId: 'E2WYWBLMWIN5U1',
        origins: {
            legacy: 'Custom-www.biglotteryfund.org.uk',
            newSite: 'ELB_LIVE',
            smallGrants: 'small-grants',
            smallGrantsTest: 'small-grants-test'
        }
    }
};

// decide which config to use (pass --live to this script to use live)
const IS_LIVE = argv.l;
const CF = (IS_LIVE) ? CF_CONFIGS.live : CF_CONFIGS.test;

// create a URL object to mark whether a URL is POST-able or not
const makeUrlObject = (url, isPostable, allowQueryStrings) => {
    return {
        isPostable: isPostable || false,
        allowQueryStrings: allowQueryStrings || false,
        path: url
    };
};

// load secret hashes for SGO form
const SGO_HASH = process.env.SGO_HASH;
const SGO_HASH_TEST = process.env.SGO_HASH_TEST;

if(!SGO_HASH || !SGO_HASH_TEST) {
    console.error('Error: could not find SGO hashes. Exiting.');
    process.exit(1);
}

// populate other app URLs that aren't in the router
// or are manual legacy links
// keys here are mapped to origin servers in config above
let URLs = {
    legacy: [],
    smallGrants: [
        // makeUrlObject('/apply-' + SGO_HASH + '/*')
    ],
    smallGrantsTest: [
        // makeUrlObject('/testapply-' + SGO_HASH_TEST + '/*')
    ],
    newSite: [
        makeUrlObject('/assets/*'),
        makeUrlObject('/contrast/*', false, true),
        makeUrlObject('/error'),
        makeUrlObject('/tools/*', true, true),
        makeUrlObject('/robots.txt'),
        makeUrlObject('/ebulletin', true, false),
        makeUrlObject('/home')
    ]
};

// lookup cookies from app config
const cookies = config.get('cookies');
const cookiesInUse = Object.keys(cookies).map((k) => cookies[k]);

// configure headers, cookies and origin servers for paths
const BehaviourConfig = {
    protocols: {
        redirectToHttps: 'redirect-to-https',
        allowAll: 'allow-all'
    },
    httpMethods: {
        getOnly: ['HEAD', 'GET'],
        getAndPost: ['HEAD', 'DELETE', 'POST', 'GET', 'OPTIONS', 'PUT', 'PATCH']
    },
    TTLs: {
        min: 0,
        max: 31536000,
        default: 86400
    },
    newSite: {
        headersToKeep: ['Accept', 'Host'],
        cookies: {
            "Forward": "whitelist",
            "WhitelistedNames": {
                "Items": cookiesInUse,
                "Quantity": cookiesInUse.length
            }
        }
    },
    legacy: {
        headersToKeep: ['*'],
        cookies: {
           "Forward": "all"
        }
    }
};

// create a JSON object configured for the legacy/new paths
const makeBehaviourItem = (origin, path, isPostable, allowQueryStrings, originServer) => {
    // the new site is properly cached, the legacy is not
    // so anything legacy should not cache cookies, headers, etc
    const isLegacy = origin !== 'newSite';
    const cacheConfig = (isLegacy) ? BehaviourConfig['legacy'] : BehaviourConfig['newSite'];

    // strip trailing slashes
    // fixes /welsh => /welsh/ homepage confusion
    // but doesn't break root/homepage '/' path
    path = utilities.stripTrailingSlashes(path);

    // use all HTTP methods for legacy
    const allowedHttpMethods = (isLegacy || isPostable) ? BehaviourConfig.httpMethods.getAndPost : BehaviourConfig.httpMethods.getOnly;
    // allow any protocol for legacy, redirect to HTTPS for new
    const protocol = (isLegacy) ? BehaviourConfig.protocols.allowAll : BehaviourConfig.protocols.redirectToHttps;

    return {
        "TrustedSigners": {
            "Enabled": false,
            "Items": [],
            "Quantity": 0
        },
        "LambdaFunctionAssociations": {
            "Items": [],
            "Quantity": 0
        },
        "TargetOriginId": originServer,
        "ViewerProtocolPolicy": protocol,
        "ForwardedValues": {
            "Headers": {
                "Items": cacheConfig.headersToKeep,
                "Quantity": cacheConfig.headersToKeep.length
            },
            "Cookies": cacheConfig.cookies,
            "QueryStringCacheKeys": {
                "Items": [],
                "Quantity": 0
            },
            "QueryString": (isLegacy || allowQueryStrings)
        },
        "MaxTTL": BehaviourConfig.TTLs.max,
        "PathPattern": path,
        "SmoothStreaming": false,
        "DefaultTTL": BehaviourConfig.TTLs.default,
        "AllowedMethods": {
            "Items": allowedHttpMethods,
            "CachedMethods": {
                "Items": [
                    "HEAD",
                    "GET"
                ],
                "Quantity": 2
            },
            "Quantity": allowedHttpMethods.length,
        },
        "MinTTL": BehaviourConfig.TTLs.min,
        "Compress": false
    };
};

// add auto URLs from route config
for (let s in routes.sections) {
    let section = routes.sections[s];
    let pages = section.pages;
    for (let p in pages) {
        let page = pages[p];
        let url = section.path + page.path;
        if (page.live) {
            if (page.isWildcard) {
                url += '*';
            }
            let welshUrl = '/welsh' + url;
            URLs.newSite.push(makeUrlObject(url, page.isPostable));
            URLs.newSite.push(makeUrlObject(welshUrl, page.isPostable));
            if (page.aliases) {
                page.aliases.forEach(alias => {
                    let url = alias;
                    let welshUrl = '/welsh' + url;
                    URLs.newSite.push(makeUrlObject(url));
                    URLs.newSite.push(makeUrlObject(welshUrl));
                });
            }
        } else {
            console.log('Skipping url for draft status: ' + url);
        }
    }
}

// add vanity redirects too
routes.vanityRedirects.forEach(redirect => {
    if (redirect.paths) {
        redirect.paths.forEach((path) => {
            URLs.newSite.push(makeUrlObject(path));
        });
    } else {
        URLs.newSite.push(makeUrlObject(redirect.path));
    }
});

// construct array of behaviours from our URL list
let behaviours = [];
for (let origin in URLs) {
    let links = URLs[origin];
    // get name of origin server (for live/test)
    let originServer = CF.origins[origin];
    links.forEach(url => {
        let item = makeBehaviourItem(origin, url.path, url.isPostable, url.allowQueryStrings, originServer);
        behaviours.push(item);
    });
}

// get existing cloudfront config
let getDistributionConfig = cloudfront.getDistribution({
    Id: CF.distributionId
}).promise();

// handle response from fetching config
getDistributionConfig.then((data) => { // fetching the config worked

    // store the old config before changing it, just in case...
    const clone = _.cloneDeep(data);
    const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
    const confPath = path.join(__dirname, `../cloudfront/${timestamp}.json`);
    const confData = JSON.stringify(clone, null, 4);

    // write config to file for backup
    try {
        fs.writeFileSync(confPath, confData);
        console.log("A copy of the existing config was saved in " + confPath);
    } catch (err) {
        return console.error('Error saving old config', err);
    }

    // store etag for later update
    const etag = data.ETag;

    // are we using a custom config (eg. a backup file)?
    if (customConfig) {
        data = customConfig;
    } else { // assign new behaviours from config here instead
        data.Distribution.DistributionConfig.CacheBehaviors.Items = behaviours;
        data.Distribution.DistributionConfig.CacheBehaviors.Quantity = behaviours.length;
    }

    // store just the distro config for update
    const conf = data.Distribution.DistributionConfig;

    const getUrls = (item) => {
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

    // record the proposed config change
    console.log(JSON.stringify(data));

    // verify what's being changed
    const paths = {
        before: clone.Distribution.DistributionConfig.CacheBehaviors.Items.map(getUrls),
        after: data.Distribution.DistributionConfig.CacheBehaviors.Items.map(getUrls)
    };
    const pathsAdded = _.filter(paths.after, (obj) => !_.find(paths.before, obj));
    const pathsRemoved = _.filter(paths.before, (obj) => !_.find(paths.after, obj));

    // warn users about changes
    console.log('There are currently ' + clone.Distribution.DistributionConfig.CacheBehaviors.Quantity + ' items in the existing behaviours, and ' + data.Distribution.DistributionConfig.CacheBehaviors.Quantity + ' in this one.');

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
    let promptSchema =   {
        description: `Are you sure you want to make this change to ${CF.distributionId}?`,
        name: 'yesno',
        type: 'string',
        pattern: /y[es]*|n[o]?/,
        message: 'Please answer the question properly',
        required: true
    };

    prompt.start();

    prompt.get(promptSchema, (err, result) => {
        if (['y', 'yes'].indexOf(result.yesno) !== -1) {
            console.log('Starting update...');

            // try to update the distribution
            let updateDistributionConfig = cloudfront.updateDistribution({
                DistributionConfig: conf,
                Id: CF.distributionId,
                IfMatch: etag
            }).promise();

            // respond to update change
            updateDistributionConfig.then((data) => { // the update worked
                console.log(data);
                console.log('CloudFront was successfully updated with the new configuration!');
            }).catch((err) => { // failed to update config
                console.log(JSON.stringify(conf));
                console.error('There was an error uploading this config', {
                    error: err
                });
            });

        } else {
            console.log('Bailing out!');
        }
    });

}).catch((err) => { // failed to get config
    console.error('There was an error fetching the config', {
        error: err
    });
});
