'use strict';
const path = require('path');
const express = require('express');

const { requireUserAuth, requireActiveUser } = require('../../common/authed');
const { injectCopy } = require('../../common/inject-content');

const router = express.Router();

router.get('/', requireUserAuth, requireActiveUser, injectCopy('user.dashboard'), (req, res) => {
    res.render(path.resolve(__dirname, './views/dashboard'), {
        alertMessage: req.query.s
            ? req.i18n.__(`user.common.alertMessages.${req.query.s}`)
            : null
    });
});

module.exports = router;
