'use strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const Sentry = require('@sentry/node');
const path = require('path');
const { concat } = require('lodash');

const { requireUserAuth } = require('../../middleware/authed');
const { JWT_SIGNING_TOKEN } = require('../../common/secrets');
const userService = require('../../services/user');

const { sendActivationEmail } = require('./helpers');

const router = express.Router();

function activate(token, user) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SIGNING_TOKEN, async (jwtError, decoded) => {
            if (jwtError) {
                reject(jwtError);
            } else {
                if (user.is_active) {
                    resolve(user);
                }

                // Was the token valid for this user?
                if (decoded.data.reason === 'activate' && decoded.data.userId === user.id) {
                    try {
                        const updatedUser = await userService.updateActivateUser({
                            id: decoded.data.userId
                        });

                        resolve(updatedUser);
                    } catch (activateError) {
                        reject(activateError);
                    }
                } else {
                    reject(new Error('invalid token'));
                }
            }
        });
    });
}

router.route('/').get(requireUserAuth, async (req, res) => {
    const token = req.query.token;
    const user = req.user.userData;

    if (token) {
        try {
            await activate(token, user);
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
