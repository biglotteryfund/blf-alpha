'use strict';
const { includes, concat } = require('lodash');
const express = require('express');
const domains = require('config').get('domains');

const { getAbsoluteUrl } = require('../common/urls');
const { legacyPagePaths, legacyFilesPath } = require('../common/archived');
const { noStore } = require('../middleware/cached');

const router = express.Router();

router.get('/', noStore, (req, res) => {
    const isIndexable = includes(domains.indexable, req.get('host')) === true;

    // Merge archived paths with internal / deliberately excluded URLs
    const disallowList = concat(
        ['/api/', '/funding/grants/', '/welsh/funding/grants/'],
        legacyFilesPath,
        legacyPagePaths
    );

    const text = [
        `user-agent: *`,
        `sitemap: ${getAbsoluteUrl(req, '/sitemap.xml')}`,
        `${
            isIndexable
                ? disallowList.map(line => `disallow: ${line}`).join('\n')
                : 'disallow: /'
        }`
    ].join('\n');
    res.setHeader('Content-Type', 'text/plain');
    res.send(text);
});

module.exports = router;
