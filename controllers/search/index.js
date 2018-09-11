'use strict';
const querystring = require('querystring');
const express = require('express');
const { noCache } = require('../../middleware/cached');
const { customEvent } = require('../../modules/analytics');
const { normaliseQuery } = require('../../modules/urls');

const router = express.Router();

router.get('/', noCache, (req, res) => {
    const queryBase = 'https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk';
    req.query = normaliseQuery(req.query);

    const redirectToSiteSearch = () => {
        res.redirect(`${queryBase}+${querystring.escape(req.query.q)}`);
    };

    if (req.query.q) {
        customEvent('Search', 'Term', req.query.q)
            .then(() => {
                redirectToSiteSearch();
            })
            .catch(() => {
                redirectToSiteSearch();
            });
    } else {
        res.redirect('/');
    }
});

module.exports = router;
