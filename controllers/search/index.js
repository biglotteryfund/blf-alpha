'use strict';
const config = require('config');
const express = require('express');
const querystring = require('querystring');

const { noCache } = require('../../middleware/cached');
const { normaliseQuery } = require('../../modules/urls');

const router = express.Router();

const domains = config.get('domains');

router.get('/', noCache, (req, res) => {
    const queryBase = `https://www.google.co.uk/search?q=site%3A${domains.host}`;
    req.query = normaliseQuery(req.query);

    if (req.query.q) {
        res.redirect(`${queryBase}+${querystring.escape(req.query.q)}`);
    } else {
        res.redirect('/');
    }
});

module.exports = router;
