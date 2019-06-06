'use strict';
const path = require('path');
const express = require('express');
const Sentry = require('@sentry/node');

const { Users } = require('../../db/models');
const {
    requireUserAuth,
    redirectUrlWithFallback
} = require('../../middleware/authed');
const {
    injectCopy,
    injectBreadcrumbs
} = require('../../middleware/inject-content');

const { verifyTokenActivate } = require('./lib/jwt');
const sendActivationEmail = require('./lib/activation-email');

const router = express.Router();

router.get(
    '/',
    requireUserAuth,
    injectCopy('user.activate'),
    injectBreadcrumbs,
    async function(req, res) {
        const template = path.resolve(__dirname, './views/activate');

        if (req.user.is_active) {
            redirectUrlWithFallback(req, res, '/user');
        } else if (req.query.token) {
            try {
                await verifyTokenActivate(req.query.token, req.user.id);
                await Users.activateUser(req.user.id);
                redirectUrlWithFallback(req, res, '/user?s=activationComplete');
            } catch (error) {
                Sentry.withScope(scope => {
                    scope.setLevel('warning');
                    Sentry.captureException(error);
                });
                res.render(template, { tokenError: true });
            }
        } else {
            res.render(template);
        }
    }
);

router.get('/resend', async function(req, res, next) {
    try {
        await sendActivationEmail(req, req.user);
        res.redirect(req.baseUrl);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
