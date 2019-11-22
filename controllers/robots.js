'use strict';
const { getAbsoluteUrl } = require('../common/urls');
const { legacyPagePaths, legacyFilesPath } = require('../common/archived');

module.exports = function(req, res) {
    const shouldIndex = req.get('host') === 'www.tnlcommunityfund.org.uk';

    // Merge archived paths with internal / deliberately excluded URLs
    const disallowList = [
        '/api/',
        '/funding/grants/',
        '/welsh/funding/grants/'
    ].concat(legacyFilesPath, legacyPagePaths);

    const disallowLine = shouldIndex
        ? disallowList.map(line => `disallow: ${line}`).join('\n')
        : 'disallow: /';

    const text = [
        `user-agent: *`,
        `sitemap: ${getAbsoluteUrl(req, '/sitemap.xml')}`,
        disallowLine
    ].join('\n');
    res.setHeader('Content-Type', 'text/plain');
    res.send(text);
};
