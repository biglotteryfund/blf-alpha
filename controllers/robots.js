'use strict';
const { concat } = require('lodash');
const express = require('express');

const { getAbsoluteUrl } = require('../common/urls');
const { legacyPagePaths, legacyFilesPath } = require('../common/archived');
const { noStore } = require('../common/cached');

const router = express.Router();

router.get('/', noStore, (req, res) => {
    const shouldIndex = req.get('host') === 'apply.tnlcommunityfund.org.uk';

    // Merge archived paths with internal / deliberately excluded URLs
    const disallowList = concat(
        ['/api/', '/funding/grants/', '/welsh/funding/grants/'],
        legacyFilesPath,
        legacyPagePaths
    );

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
});

module.exports = router;
