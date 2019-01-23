'use strict';

// We default to a 2017 crawl because it's the last date before we began
// redirecting pages to the archives, meaning we can no longer send old pages there.
function buildArchiveUrl(urlPath, crawlDate = '20171011152352') {
    const fullUrl = `https://www.biglotteryfund.org.uk${urlPath}`;
    return `http://webarchive.nationalarchives.gov.uk/${crawlDate}/${fullUrl}`;
}

module.exports = {
    buildArchiveUrl
};
