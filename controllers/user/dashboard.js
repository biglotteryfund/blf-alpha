'use strict';
const path = require('path');
const express = require('express');

const { requireUserAuth, requireActiveUser } = require('../../common/authed');

const router = express.Router();

router.get('/', requireUserAuth, requireActiveUser, function (req, res) {
    res.render(path.resolve(__dirname, './views/dashboard'), {
        title: req.i18n.__('user.dashboard.title'),
        alertMessage: req.query.s
            ? req.i18n.__(`user.common.alertMessages.${req.query.s}`)
            : null,
    });
});

module.exports = router;
