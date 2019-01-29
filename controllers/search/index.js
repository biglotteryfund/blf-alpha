'use strict';
const querystring = require('querystring');
const express = require('express');

const { noCache } = require('../../middleware/cached');
const { normaliseQuery } = require('../../modules/urls');

const router = express.Router();

router.get('/', noCache, (req, res) => {
    req.query = normaliseQuery(req.query);

    if (req.query.q) {
        const term = querystring.escape(req.query.q);
        res.redirect(
            `https://www.google.co.uk/search?q=${term}+site%3Awww.biglotteryfund.org.uk+OR+site%3Awww.tnlcommunityfund.org.uk`
        );
    } else {
        res.redirect('/');
    }
});

module.exports = router;
