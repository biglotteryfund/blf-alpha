'use strict';
const path = require('path');
const express = require('express');
const Sentry = require('@sentry/node');
const moment = require('moment');

const { Users } = require('../../db/models');
const {
    requireUserAuth,
    redirectUrlWithFallback
} = require('../../middleware/authed');
const {
    injectCopy,
    injectBreadcrumbs
} = require('../../middleware/inject-content');

const logger = require('../../common/logger').child({
    service: 'user'
});

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
                logger.info('Activation succeeded');
                redirectUrlWithFallback(req, res, '/user?s=activationComplete');
            } catch (error) {
                logger.warn('Activation token failed');
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
            const dateOfActivationAttempt = moment().unix();

            await sendActivationEmail(
                req,
                req.user.userData,
                dateOfActivationAttempt
            );

            await Users.updateDateOfActivationAttempt({
                id: req.user.userData.id,
                dateOfActivationAttempt: dateOfActivationAttempt
            });

            res.locals.resendSuccessful = true;
            logger.info('Activation email sent');
            renderTemplate(req, res);
        } catch (err) {
            logger.error('Activation email failed', err);
            next(err);
        }
    });

module.exports = router;
