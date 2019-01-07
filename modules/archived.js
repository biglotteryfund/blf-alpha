'use strict';

const LAST_GOOD_CRAWL_DATE = '20171011152352';

function buildArchiveUrl(urlPath) {
    const fullUrl = `https://www.biglotteryfund.org.uk${urlPath}`;
    return `http://webarchive.nationalarchives.gov.uk/${LAST_GOOD_CRAWL_DATE}/${fullUrl}`;
}

module.exports = {
    buildArchiveUrl
};
