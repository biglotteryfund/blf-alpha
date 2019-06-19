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

const logger = require('../../common/logger');

const { verifyTokenActivate } = require('./lib/jwt');
const sendActivationEmail = require('./lib/activation-email');

const router = express.Router();

function renderTemplate(req, res) {
    const template = path.resolve(__dirname, './views/activate');
    res.render(template);
}

router
    .route('/')
    .all(
        requireUserAuth,
        injectCopy('user.activate'),
        injectBreadcrumbs,
        function(req, res, next) {
            if (req.user.userData.is_active) {
                redirectUrlWithFallback(req, res, '/user');
            } else {
                next();
            }
        }
    )
    .get(async function(req, res) {
        if (req.query.token) {
            try {
                await verifyTokenActivate(
                    req.query.token,
                    req.user.userData.id
                );
                await Users.activateUser(req.user.userData.id);
                logger.info('User activation: succeeded');
                redirectUrlWithFallback(req, res, '/user?s=activationComplete');
            } catch (error) {
                logger.info('User activation: token failed', {
                    error: error
                });
                Sentry.withScope(scope => {
                    scope.setLevel('warning');
                    Sentry.captureException(error);
                });
                res.locals.tokenError = true;
                renderTemplate(req, res);
            }
        } else {
            renderTemplate(req, res);
        }
    })
    .post(async function(req, res, next) {
        try {
            await sendActivationEmail(req, req.user.userData);
            res.locals.resendSuccessful = true;
            logger.info('User activation: email sent');
            renderTemplate(req, res);
        } catch (err) {
            logger.info('User activation: email failed', {
                error: err
            });
            next(err);
        }
    });

module.exports = router;
