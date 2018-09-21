'use strict';
const express = require('express');

const router = express.Router();

const { noCache } = require('../../middleware/cached');

router.get('/', noCache, (req, res) => {
    req.logout();
    req.session.save(() => {
        res.redirect(`/user/login`);
    });
});

module.exports = router;
