'use strict';
const path = require('path');
const express = require('express');

const { Users } = require('../../db/models');
const {
    redirectUrlWithFallback,
    requireUnactivatedUser,
    isActivated,
} = require('../../common/authed');
const logger = require('../../common/logger').child({ service: 'user' });

const { verifyTokenActivate } = require('./lib/jwt');
const sendActivationEmail = require('./lib/activation-email');

const router = express.Router();

function renderTemplate(req, res) {
    const template = path.resolve(__dirname, './views/activate');
    res.render(template, {
        title: req.i18n.__('user.activate.title'),
    });
}

router
    .route('/')
    .get(async function (req, res) {
        // Prevent activated users from persisting on this page
        if (req.user && isActivated(req.user)) {
            return res.redirect('/user');
        }
        if (req.query.token) {
            logger.info('Activation attempted', {
                eventSource: 'user',
            });
            try {
                const decodedData = await verifyTokenActivate(req.query.token);
                await Users.activateUser(decodedData.userId);
                logger.info('Activation succeeded');
                redirectUrlWithFallback(req, res, '/user?s=activationComplete');
            } catch (error) {
                logger.warn('Activation token failed');
                res.locals.tokenError = true;
                renderTemplate(req, res);
            }
        } else {
            renderTemplate(req, res);
        }
    })
    .post(requireUnactivatedUser, async function (req, res, next) {
        try {
            await sendActivationEmail(req, req.user.userData);

            res.locals.resendSuccessful = true;
            logger.info('Activation email re-sent');
            renderTemplate(req, res);
        } catch (err) {
            logger.error('Activation email failed', err);
            next(err);
        }
    });

module.exports = router;
