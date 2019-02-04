'use strict';
const config = require('config');
const { flatMap } = require('lodash');

const { makeWelsh } = require('./urls');

// We default to a 2017 crawl because it's the last date before we began
// redirecting pages to the archives, meaning we can no longer send old pages there.
function buildArchiveUrl(urlPath, crawlDate = '20171011152352') {
    const fullUrl = `https://www.biglotteryfund.org.uk${urlPath}`;
    return `http://webarchive.nationalarchives.gov.uk/${crawlDate}/${fullUrl}`;
}

// Construct a list of legacy page paths (prefixed with welsh equivalents)
// in order to archive them and block them from search engines.
const legacyPagePaths = flatMap(config.get('archivedPaths.legacyPagePaths'), urlPath => [urlPath, makeWelsh(urlPath)]);

module.exports = {
    buildArchiveUrl,
    legacyPagePaths
};
