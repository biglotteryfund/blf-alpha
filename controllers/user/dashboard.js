'use strict';
const path = require('path');
const express = require('express');

const { requireUserAuth } = require('../../common/authed');
const { injectCopy } = require('../../middleware/inject-content');

const router = express.Router();

router.get('/', requireUserAuth, injectCopy('user.dashboard'), (req, res) => {
    res.render(path.resolve(__dirname, './views/dashboard'), {
        alertMessage: req.query.s
            ? req.i18n.__(`user.common.alertMessages.${req.query.s}`)
            : null
    });
});

module.exports = router;
