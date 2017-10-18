'use strict';
const { has, cloneDeep } = require('lodash');
const assets = require('./assets');

// rewrite text like '/welsh/' => '/welsh'
const stripTrailingSlashes = str => {
    let hasTrailingSlash = s => s[s.length - 1] === '/' && s.length > 1;

    if (hasTrailingSlash(str)) {
        // trim final character
        str = str.substring(0, str.length - 1);
    }

    return str;
};

// parse the string (eg. "£10,000" => 10000, "£1 million" => 1000000 etc)
const parseValueFromString = str => {
    const replacements = [['million', '000000'], [/,/g, ''], [/£/g, ''], [/ /g, '']];

    let upper = str.split(' - ')[1];
    if (upper) {
        replacements.forEach(r => {
            upper = upper.replace(r[0], r[1]);
        });
        upper = parseInt(upper);
    }
    return upper || str;
};

const createHeroImage = opts => {
    if (!['small', 'medium', 'large'].every(x => has(opts, x))) {
        throw new Error('Must pass a small, medium, and large image');
    }

    if (!has(opts, 'default')) {
        throw new Error('Must define a default image with opts.default');
    }

    return {
        small: assets.getCachebustedPath(opts.small),
        medium: assets.getCachebustedPath(opts.medium),
        large: assets.getCachebustedPath(opts.large),
        default: assets.getCachebustedPath(opts.default),
        caption: opts.caption || ''
    };
};

// take a route config and format it for cloudfront
const makeUrlObject = (page, customPath) => {
    return {
        path: customPath || page.path,
        isPostable: page.isPostable || false,
        allowQueryStrings: page.allowQueryStrings || false
    };
};

// take the routes.js configuration and output locale-friendly URLs
// with support for POST, querystrings and redirects for Cloudfront
const generateUrlList = routes => {
    // keys here are mapped to origin servers in the Cloudfront distribution config
    let urlList = {
        // if anything is added here, the TEST Cloudfront distribution
        // will fail to update as it doesn't have a legacy origin.
        legacy: [],
        newSite: []
    };

    let makeWelsh = url => '/welsh' + url;

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
                // create route mapping for canonical URLs
                urlList.newSite.push(makeUrlObject(page, url));
                urlList.newSite.push(makeUrlObject(page, makeWelsh(url)));

                // add redirects for aliases
                if (page.aliases) {
                    page.aliases.forEach(alias => {
                        let page = { path: alias };
                        urlList.newSite.push(makeUrlObject(page));
                        urlList.newSite.push(makeUrlObject(page, makeWelsh(page.path)));
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
                let page = { path: path };
                urlList.newSite.push(makeUrlObject(page));
            });
        } else {
            let page = { path: redirect.path };
            urlList.newSite.push(makeUrlObject(page));
        }
    });

    // finally add the miscellaneous routes for static files etc
    routes.otherUrls.filter(r => r.live).forEach(routeConfig => {
        urlList.newSite.push(makeUrlObject(routeConfig));
    });

    return urlList;
};

module.exports = {
    stripTrailingSlashes,
    parseValueFromString,
    createHeroImage,
    makeUrlObject,
    generateUrlList
};
