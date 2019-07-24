'use strict';
const path = require('path');
const express = require('express');

const { requireUserAuth } = require('../../middleware/authed');
const { injectCopy } = require('../../middleware/inject-content');

const alertMessage = require('../../common/alert-message');

const router = express.Router();

router.get('/', requireUserAuth, injectCopy('user.dashboard'), (req, res) => {
    res.render(path.resolve(__dirname, './views/dashboard'), {
        alertMessage: alertMessage({
            locale: req.i18n.getLocale(),
            status: req.query.s
        })
    });
});

module.exports = router;
