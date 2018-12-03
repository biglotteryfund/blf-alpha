'use strict';

const { flatMap } = require('lodash');
const { makeWelsh } = require('../modules/urls');

/**
 * Archived
 * Paths in this array will be redirected to the National Archives.
 * We show an interstitial page a) to let people know the page has been archived
 * and b) to allow us to record the redirect as a pageview using standard analytics behaviour.
 */
// prettier-ignore
const archived = [
    '/about-big/10-big-lottery-fund-facts',
    '/funding/funding-guidance/applying-for-funding/*'
];

module.exports = flatMap(archived, urlPath => [urlPath, makeWelsh(urlPath)]);
