'use strict';
const querystring = require('querystring');
const express = require('express');

const { noStore } = require('../common/cached');

const router = express.Router();

router.get('/', noStore, function (req, res) {
    if (req.query.q) {
        const term = querystring.escape(req.query.q);
        res.redirect(
            `https://www.google.co.uk/search?q=site%3Awww.tnlcommunityfund.org.uk+${term}`
        );
    } else {
        res.redirect('/');
    }
});

module.exports = router;
