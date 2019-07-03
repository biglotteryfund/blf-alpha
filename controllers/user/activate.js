'use strict';
const path = require('path');
const express = require('express');
const Sentry = require('@sentry/node');

const { Users } = require('../../db/models');
const injectCopy = require('../../common/inject-copy');
const {
    requireUserAuth,
    redirectUrlWithFallback
} = require('../../middleware/authed');

const logger = require('../../common/logger').child({
    service: 'user'
});

const { verifyTokenActivate } = require('./lib/jwt');
const sendActivationEmail = require('./lib/activation-email');

const router = express.Router();

const TEMPLATE_PATH = path.resolve(__dirname, './views/activate');

function redirectIfAlreadyActive(req, res, next) {
    if (req.user.userData.is_active) {
        redirectUrlWithFallback(req, res, '/user');
    } else {
        next();
    }
}

router
    .route('/')
    .all(requireUserAuth, injectCopy('user.activate'), redirectIfAlreadyActive)
    .get(async function(req, res) {
        if (req.query.token) {
            try {
                await verifyTokenActivate(
                    req.query.token,
                    req.user.userData.id
                );
                await Users.activateUser(req.user.userData.id);
                logger.info('Activation succeeded');
                redirectUrlWithFallback(req, res, '/user?s=activationComplete');
            } catch (error) {
                logger.warn('Activation token failed');
                Sentry.withScope(scope => {
                    scope.setLevel('warning');
                    Sentry.captureException(error);
                });
                res.render(TEMPLATE_PATH, { tokenError: true });
            }
        } else {
            res.render(TEMPLATE_PATH);
        }
    })
    .post(async function(req, res, next) {
        try {
            await sendActivationEmail(req, req.user.userData);
            res.render(TEMPLATE_PATH, { resendSuccessful: true });
        } catch (err) {
            logger.error('Activation email failed', err);
            next(err);
        }
    });

module.exports = router;
