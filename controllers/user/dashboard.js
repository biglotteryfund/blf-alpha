'use strict';
const path = require('path');
const express = require('express');

const { requireUserAuth } = require('../../middleware/authed');
const { injectCopy } = require('../../middleware/inject-content');

const router = express.Router();

router.get('/', requireUserAuth, injectCopy('user.dashboard'), (req, res) => {
    res.render(path.resolve(__dirname, './views/dashboard'), {
        alertMessage: req.i18n.__(`user.common.alertMessages.${req.query.s}`)
    });
});

module.exports = router;
