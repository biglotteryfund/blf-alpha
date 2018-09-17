'use strict';
const express = require('express');

const router = express.Router();

const { noCache } = require('../../middleware/cached');
const { STATUSES } = require('./helpers');

router.get('/', noCache, (req, res) => {
    req.logout();
    req.session.save(() => {
        res.redirect(`/user/login?s=${STATUSES.LOGGED_OUT}`);
    });
});

module.exports = router;
