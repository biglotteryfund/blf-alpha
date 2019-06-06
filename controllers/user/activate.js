'use strict';
const path = require('path');
const express = require('express');
const concat = require('lodash/concat');
const Sentry = require('@sentry/node');

const { requireUserAuth } = require('../../middleware/authed');
const userService = require('../../services/user');

const { verifyTokenActivate } = require('./lib/jwt');
const sendActivationEmail = require('./lib/activation-email');

const router = express.Router();

router.route('/').get(requireUserAuth, async (req, res) => {
    const token = req.query.token;
    const user = req.user.userData;

    if (token) {
        try {
            await verifyTokenActivate(req.query.token, req.user.id);
            await userService.updateActivateUser({
                id: req.user.id
            });
            res.redirect('/user?s=activationComplete');
        } catch (error) {
            Sentry.captureException(error);
            res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
                label: 'Activate account'
            });
            res.render(path.resolve(__dirname, './views/activate-error'));
        }
    } else {
        // no token, so send them an activation email
        if (!user.is_active) {
            await sendActivationEmail(req, user);
        }

        req.session.save(() => {
            res.redirect('/user?s=activationSent');
        });
    }
});

module.exports = router;
