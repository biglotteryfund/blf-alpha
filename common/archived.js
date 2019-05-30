'use strict';
const { flatMap } = require('lodash');

const { makeWelsh } = require('./urls');

// We default to a 2017 crawl because it's the last date before we began
// redirecting pages to the archives, meaning we can no longer send old pages there.
function buildArchiveUrl(urlPath, crawlDate = '20171011152352') {
    const fullUrl = `https://www.biglotteryfund.org.uk${urlPath}`;
    return `http://webarchive.nationalarchives.gov.uk/${crawlDate}/${fullUrl}`;
}

// A list of legacy page paths which we archive and block from search engines.
const legacyPagePaths = [
    '/about-big/10-big-lottery-fund-facts',
    '/about-big/big-lottery-fund-in-your-constituency',
    '/about-big/community-closed',
    '/about-big/countries*',
    '/about-big/future-of-doing-good',
    '/about-big/living-wage',
    '/about-big/mayors-community-weekend',
    '/about-big/our-approach/vision-and-principles',
    '/about-big/publications*',
    '/about-big/your-voice',
    '/funding/big-stories*',
    '/funding/celebrateuk*',
    '/funding/funding-guidance/applying-for-funding/*',
    '/funding/funding-guidance/managing-your-funding/about-equalities*',
    '/funding/funding-guidance/managing-your-funding/reaching-communities-grant-offer',
    '/funding/joint-funding',
    '/funding/peoples-projects-resources',
    '/funding/scotland-portfolio*',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-qa*',
    '/global-content/press-releases/*',
    '/research*'
];

module.exports = {
    buildArchiveUrl,
    legacyPagePaths: flatMap(legacyPagePaths, urlPath => [urlPath, makeWelsh(urlPath)]),
    legacyFilesPath: '/-/media/files/*'
};
