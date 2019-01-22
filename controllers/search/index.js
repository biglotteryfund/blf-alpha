'use strict';
const querystring = require('querystring');
const express = require('express');
const domains = require('config').get('domains');

const { noCache } = require('../../middleware/cached');
const { normaliseQuery } = require('../../modules/urls');

const router = express.Router();

router.get('/', noCache, (req, res) => {
    const queryBase = `https://www.google.co.uk/search?q=site%3A${domains.searchDomain}`;
    req.query = normaliseQuery(req.query);

    if (req.query.q) {
        res.redirect(`${queryBase}+${querystring.escape(req.query.q)}`);
    } else {
        res.redirect('/');
    }
});

module.exports = router;
