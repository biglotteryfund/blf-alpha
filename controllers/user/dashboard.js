'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();

const { noCache } = require('../../middleware/cached');
const { requireAuthed } = require('../../middleware/authed');

const { STATUSES } = require('./helpers');

router.get('/', noCache, requireAuthed, (req, res) => {
    res.render(path.resolve(__dirname, './views/dashboard'), {
        user: req.user,
        errors: res.locals.errors || [],
        activationSent: req.query.s === STATUSES.ACTIVATION_SENT
    });
});

module.exports = router;
