'use strict';
const { stripIndents } = require('common-tags');
const { getAbsoluteUrl } = require('../common/urls');

module.exports = function(req, res) {
    const shouldIndex = req.get('host') === 'www.tnlcommunityfund.org.uk';

    /**
     * Prevent crawling of the following URLs for traffic management purposes
     * @see https://support.google.com/webmasters/answer/6062608
     */
    const disallowList = ['/funding/grants/', '/welsh/funding/grants/']
        .map(line => `disallow: ${line}`)
        .join('\n');

    res.setHeader('Content-Type', 'text/plain');
    res.send(stripIndents`
        user-agent: *
        sitemap: ${getAbsoluteUrl(req, '/sitemap.xml')}
        ${shouldIndex ? disallowList : 'disallow: /'}
    `);
};
