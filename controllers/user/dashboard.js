'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();
const { concat } = require('lodash');

router.get('/', (req, res) => {
    let alertMessage;
    switch (req.query.s) {
        case 'passwordUpdated':
            alertMessage = 'Your password was successfully updated!';
            break;
        case 'activationSent':
            alertMessage = `We have sent an email to ${
                req.user.userData.username
            } with a link to activate your account.`;
            break;
        case 'activationComplete':
            alertMessage = `Your account was successfully activated!`;
            break;
    }

    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
        label: 'Dashboard'
    });

    res.render(path.resolve(__dirname, './views/dashboard'), {
        user: req.user,
        errors: res.locals.errors || [],
        alertMessage: alertMessage
    });
});

module.exports = router;
