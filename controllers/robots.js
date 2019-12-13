'use strict';
const { stripIndents } = require('common-tags');
const { getAbsoluteUrl } = require('../common/urls');

module.exports = function(req, res) {
    const shouldIndex = req.get('host') === 'www.tnlcommunityfund.org.uk';

    res.setHeader('Content-Type', 'text/plain');
    res.send(stripIndents`
        user-agent: *
        sitemap: ${getAbsoluteUrl(req, '/sitemap.xml')}
        ${shouldIndex ? '' : 'disallow: /'}
    `);
};
