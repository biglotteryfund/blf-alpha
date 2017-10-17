#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const config = require('config');
const AWS = require('aws-sdk');

const routes = require('../controllers/routes');
const utilities = require('./utilities');

// create AWS SDK instance
const credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });
AWS.config.credentials = credentials;
const cloudfront = new AWS.CloudFront();

// configure cloudfront-specific items here
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

// create a URL object to mark whether a URL is POST-able or not
const makeUrlObject = (url, isPostable, allowQueryStrings) => {
    return {
        isPostable: isPostable || false,
        allowQueryStrings: allowQueryStrings || false,
        path: url
    };
};

// populate other app URLs that aren't in the router
// or are manual legacy links
// keys here are mapped to origin servers in config above
let URLs = {
    // if anything is added here, the TEST Cloudfront distribution will fail
    // as it doesn't have a legacy origin.
    legacy: [],
    newSite: [
        makeUrlObject('/assets/*'),
        makeUrlObject('/contrast/*', false, true),
        makeUrlObject('/error'),
        makeUrlObject('/tools/*', true, true),
        makeUrlObject('/styleguide'),
        makeUrlObject('/robots.txt'),
        makeUrlObject('/ebulletin', true, false),
        makeUrlObject('/home'),
        makeUrlObject('/funding/funding-finder', true, true)
    ]
};

// lookup cookies from app config
const cookies = config.get('cookies');
const cookiesInUse = Object.keys(cookies).map(k => cookies[k]);

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
            Forward: 'whitelist',
            WhitelistedNames: {
                Items: cookiesInUse,
                Quantity: cookiesInUse.length
            }
        }
    },
    legacy: {
        headersToKeep: ['*'],
        cookies: {
            Forward: 'all'
        }
    }
};

// create a JSON object configured for the legacy/new paths
const makeBehaviourItem = (origin, path, isPostable, allowQueryStrings, originServer) => {
    // the new site is properly cached, the legacy is not
    // so anything legacy should not cache cookies, headers, etc
    const isLegacy = origin !== 'newSite';
    const cacheConfig = isLegacy ? BehaviourConfig['legacy'] : BehaviourConfig['newSite'];

    // strip trailing slashes
    // fixes /welsh => /welsh/ homepage confusion
    // but doesn't break root/homepage '/' path
    path = utilities.stripTrailingSlashes(path);

    // use all HTTP methods for legacy
    const allowedHttpMethods =
        isLegacy || isPostable ? BehaviourConfig.httpMethods.getAndPost : BehaviourConfig.httpMethods.getOnly;
    // allow any protocol for legacy, redirect to HTTPS for new
    const protocol = isLegacy ? BehaviourConfig.protocols.allowAll : BehaviourConfig.protocols.redirectToHttps;

    return {
        TrustedSigners: {
            Enabled: false,
            Items: [],
            Quantity: 0
        },
        LambdaFunctionAssociations: {
            Items: [],
            Quantity: 0
        },
        TargetOriginId: originServer,
        ViewerProtocolPolicy: protocol,
        ForwardedValues: {
            Headers: {
                Items: cacheConfig.headersToKeep,
                Quantity: cacheConfig.headersToKeep.length
            },
            Cookies: cacheConfig.cookies,
            QueryStringCacheKeys: {
                Items: [],
                Quantity: 0
            },
            QueryString: isLegacy || allowQueryStrings
        },
        MaxTTL: BehaviourConfig.TTLs.max,
        PathPattern: path,
        SmoothStreaming: false,
        DefaultTTL: BehaviourConfig.TTLs.default,
        AllowedMethods: {
            Items: allowedHttpMethods,
            CachedMethods: {
                Items: ['HEAD', 'GET'],
                Quantity: 2
            },
            Quantity: allowedHttpMethods.length
        },
        MinTTL: BehaviourConfig.TTLs.min,
        Compress: false
    };
};

const generateUrlList = () => {
    let urlList = _.cloneDeep(URLs);

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
                urlList.newSite.push(makeUrlObject(url, page.isPostable));
                urlList.newSite.push(makeUrlObject(welshUrl, page.isPostable));
                if (page.aliases) {
                    page.aliases.forEach(alias => {
                        let url = alias;
                        let welshUrl = '/welsh' + url;
                        urlList.newSite.push(makeUrlObject(url));
                        urlList.newSite.push(makeUrlObject(welshUrl));
                    });
                }
            } else {
                console.log(`Skipping URL because it's marked as draft: ${url}`);
            }
        }
    }

    // add vanity redirects too
    routes.vanityRedirects.forEach(redirect => {
        if (redirect.paths) {
            redirect.paths.forEach(path => {
                urlList.newSite.push(makeUrlObject(path));
            });
        } else {
            urlList.newSite.push(makeUrlObject(redirect.path));
        }
    });

    return urlList;
};

// make a list of every URL we need to serve
// across all origins
const urlsToSupport = generateUrlList();

// construct array of behaviours from a URL list
// eg. route them to the relevant origins
// based on the disribution (test/live)
const generateBehaviours = (distribution, environment) => {
    let behaviours = [];
    for (let origin in urlsToSupport) {
        let links = urlsToSupport[origin];
        if (links.length > 0) {
            console.log(
                `Adding ${links.length} URLs routing to "${origin}" to config for "${environment}" distribution`
            );
            // get name of origin server (for live/test)
            let originServer = distribution.origins[origin];
            links.forEach(url => {
                let item = makeBehaviourItem(origin, url.path, url.isPostable, url.allowQueryStrings, originServer);
                behaviours.push(item);
            });
        }
    }
    return behaviours;
};

// for each cloudfront distribution, generate a config and store it
for (let environment in CF_CONFIGS) {
    console.log(`Fetching existing Cloudfront configuration for the "${environment}" distribution.`);
    const distribution = CF_CONFIGS[environment];

    // get existing cloudfront config
    cloudfront
        .getDistribution({
            Id: distribution.distributionId
        })
        .promise()
        .then(data => {
            // create the new behaviour config for this distribution
            let behaviours = generateBehaviours(distribution, environment);

            // assign the new behaviours to the existing config
            data.Distribution.DistributionConfig.CacheBehaviors.Items = behaviours;
            data.Distribution.DistributionConfig.CacheBehaviors.Quantity = behaviours.length;

            // write config to file for future deployment updates
            try {
                const confPath = path.join(__dirname, `../bin/cloudfront/${environment}.json`);
                const confData = JSON.stringify(data, null, 4);
                fs.writeFileSync(confPath, confData);
                console.log(`An updated config for the "${environment}" distribution was saved in ${confPath}`);
            } catch (err) {
                return console.error('Error saving config', err);
            }
        })
        .catch(err => {
            // failed to get config
            console.error('There was an error fetching the config', {
                error: err
            });
        });
}
