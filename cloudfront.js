const routes = require('./routes/routes');
const _ = require('lodash');
const AWS = require('aws-sdk');

// create AWS SDK instance
const credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
AWS.config.credentials = credentials;
const cloudfront = new AWS.CloudFront();

// create a URL object to mark whether a URL is POST-able or not
const makeUrlObject = (url, isPostable) => {
    return {
        isPostable: isPostable || false,
        path: url
    };
};

// populate other app URLs that aren't in the router
// or are manual legacy links
let URLs = {
    legacy: [
        makeUrlObject('/apply'),
        makeUrlObject('/testapply')
    ],
    newSite: [
        makeUrlObject('/assets/*'),
        makeUrlObject('/contrast/*'),
        makeUrlObject('/error')
    ]
};

// configure headers, cookies and origin servers for paths
const CONFIG = {
    distributionId: 'E3D5QJTWAG3GDP',
    protocols: {
        redirectToHttps: 'redirect-to-https',
        allowAll: 'allow-all'
    },
    httpMethods: {
        getOnly: ['HEAD', 'GET'],
        getAndPost: ['HEAD', 'DELETE', 'POST', 'GET', 'OPTIONS', 'PUT', 'PATCH']
    },
    TTLs: {
        max: 31536000,
        min: 0,
        default: 86400
    },
    newSite: {
        targetOriginId: 'ELB-TEST',
        headersToKeep: ['Accept', 'Host'],
        cookies: {
            "Forward": "whitelist",
            "WhitelistedNames": {
                "Items": ['blf-alpha-session', '_csrf', 'contrastMode'],
                "Quantity": 3
            }
        }
    },
    legacy: {
        targetOriginId: 'ELB-LIVE',
        headersToKeep: ['*'],
        cookies: {
           "Forward": "all"
        }
    }
};

// create a JSON object configured for the legacy/new paths
const makeBehaviourItem = (origin, path, isPostable) => {
    const isLegacy = origin === 'legacy';
    const allowedHttpMethods = (isLegacy || isPostable) ? CONFIG.httpMethods.getAndPost : CONFIG.httpMethods.getOnly;
    const protocol = (isLegacy) ? CONFIG.protocols.allowAll : CONFIG.protocols.redirectToHttps;
    return {
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "LambdaFunctionAssociations": {
            "Quantity": 0
        },
        "TargetOriginId": CONFIG[origin].targetOriginId,
        "ViewerProtocolPolicy": protocol,
        "ForwardedValues": {
            "Headers": {
                "Items": CONFIG[origin].headersToKeep,
                "Quantity": CONFIG[origin].headersToKeep.length
            },
            "Cookies": CONFIG[origin].cookies,
            "QueryStringCacheKeys": {
                "Quantity": 0
            },
            "QueryString": isLegacy
        },
        "MaxTTL": CONFIG.TTLs.max,
        "PathPattern": path,
        "SmoothStreaming": false,
        "DefaultTTL": CONFIG.TTLs.default,
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
        "MinTTL": CONFIG.TTLs.min,
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
        if (page.isWildcard) { url += '*'; }
        let welshUrl = '/welsh' + url;
        URLs.newSite.push(makeUrlObject(url, page.isPostable));
        URLs.newSite.push(makeUrlObject(welshUrl, page.isPostable));
        if (page.aliases) {
            page.aliases.forEach(alias => {
                let url = section.path + alias;
                let welshUrl = '/welsh' + url;
                URLs.newSite.push(makeUrlObject(url));
                URLs.newSite.push(makeUrlObject(welshUrl));
            });
        }
    }
}

// add vanity redirects too
routes.vanityRedirects.forEach(redirect => {
    URLs.newSite.push(makeUrlObject(redirect.path));
});

// make AWS JSON for legacy URLs
let behavioursLegacy = [];
behavioursLegacy = URLs.legacy.map(url => {
    return makeBehaviourItem('legacy', url.path, url.isPostable);
});

// make AWS JSON for new site URLs
let behavioursNew = [];
behavioursNew = URLs.newSite.map(url => {
    return makeBehaviourItem('newSite', url.path, url.isPostable);
});

// join the two behaviour lists
const behaviours = behavioursLegacy.concat(behavioursNew);

// get cloudfront config
let getDistributionConfig = cloudfront.getDistribution({
    Id: CONFIG.distributionId
}).promise();

// handle response from fetching config
getDistributionConfig.then((data) => { // fetching the config worked
    // store the old one before changing it, just in case...
    const clone = _.cloneDeep(data);

    // store etag for later update
    const etag = data.ETag;

    // assign new behaviours
    data.Distribution.DistributionConfig.CacheBehaviors.Items = behaviours;
    data.Distribution.DistributionConfig.CacheBehaviors.Quantity = behaviours.length;
    const conf = data.Distribution.DistributionConfig;

    // try to update the distribution
    let updateDistributionConfig = cloudfront.updateDistribution({
        DistributionConfig: conf,
        Id: CONFIG.distributionId,
        IfMatch: etag
    }).promise();
    updateDistributionConfig.then((data) => { // the update worked
        console.log(data);
        console.log('CloudFront was successfully updated with the new configuration');
    }).catch((err) => { // failed to update config
        console.log(JSON.stringify(conf));
        console.error('There was an error uploading this config', {
            error: err
        });
    });

}).catch((err) => { // failed to get config
    console.error('There was an error fetching the config', {
        error: err
    });
});