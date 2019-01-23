'use strict';

const LAST_GOOD_CRAWL_DATE = '20171011152352';

function buildArchiveUrl(urlPath, crawlDate = LAST_GOOD_CRAWL_DATE) {
    const fullUrl = `https://www.biglotteryfund.org.uk${urlPath}`;
    return `http://webarchive.nationalarchives.gov.uk/${crawlDate}/${fullUrl}`;
}

module.exports = {
    buildArchiveUrl
};
