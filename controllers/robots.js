'use strict';
const { stripIndents } = require('common-tags');
const { getAbsoluteUrl } = require('../common/urls');

/**
 * robots.txt handler
 *
 * As per https://support.google.com/webmasters/answer/6062608 we favour
 * noindex over exclusions in robots.txt
 *
 * > **You should not use robots.txt as a means
 * > to hide your web pages from Google Search results**.
 * > This is because, if other pages point to your page with descriptive text,
 * > your page could still be indexed without visiting the page.
 * > If you want to block your page from search results,
 * > use another method such as password protection or a noindex directive.
 *
 * Based on this the robots.txt definition is minimal.
 * Covering on a link to a site-map and defining if the site as a whole should be
 * indexed based on the hostname (i.e. only indexed in production)
 */
module.exports = function(req, res) {
    const shouldIndex = req.get('host') === 'www.tnlcommunityfund.org.uk';

    res.setHeader('Content-Type', 'text/plain');
    res.send(stripIndents`
        user-agent: *
        sitemap: ${getAbsoluteUrl(req, '/sitemap.xml')}
        ${shouldIndex ? '' : 'disallow: /'}
    `);
};
