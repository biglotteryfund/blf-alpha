'use strict';
const path = require('path');
const express = require('express');

const { csrfProtection } = require('../../common/cached');
const { requireActiveUser } = require('../../common/authed');

const router = express.Router();

router.get('/', csrfProtection, requireActiveUser, function(req, res) {
    res.render(path.resolve(__dirname, './views/dashboard-new.njk'), {});
});

module.exports = router;
