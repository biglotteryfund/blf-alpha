'use strict';
const path = require('path');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator/check');
const express = require('express');

const { JWT_SIGNING_TOKEN } = require('../../modules/secrets');
const { noCache } = require('../../middleware/cached');
const { requireUnauthed } = require('../../middleware/authed');
const userService = require('../../services/user');

const { validators } = require('./helpers');

const router = express.Router();

function verify(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SIGNING_TOKEN, async (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                if (decoded.data.reason === 'resetpassword') {
                    try {
                        const user = await userService.findWithActivePasswordReset({
                            id: decoded.data.userId
                        });

                        if (user) {
                            resolve(user);
                        } else {
                            reject(new Error('user not found'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error('invalid token reason'));
                }
            }
        });
    });
}

function renderForm(req, res) {
    res.render(path.resolve(__dirname, './views/reset-password'), {
        errors: res.locals.errors || []
    });
}

function renderFormExpired(req, res) {
    res.render(path.resolve(__dirname, './views/reset-password-expired'));
}

router
    .route('/')
    .all(requireUnauthed)
    .get(noCache, async (req, res) => {
        let token = req.query.token ? req.query.token : res.locals.token;
        if (!token) {
            return res.redirect('/user/login');
        }

        try {
            await verify(token);
            res.locals.token = token;
            renderForm(req, res);
        } catch (error) {
            renderFormExpired(req, res);
        }
    })
    .post(validators.password, async (req, res) => {
        const changePasswordToken = req.body.token;

        if (!changePasswordToken) {
            res.redirect('/user/login');
        } else {
            // store the token to pass on to other requests (eg. outside the URL)
            res.locals.token = changePasswordToken;
            const errors = validationResult(req);

            if (errors.isEmpty()) {
                try {
                    const user = await verify(changePasswordToken);

                    try {
                        await userService.updateNewPassword({
                            id: user.id,
                            newPassword: req.body.password
                        });

                        res.redirect('/user/login?s=passwordUpdated');
                    } catch (error) {
                        res.locals.alertMessage = 'There was an error updating your password - please try again';
                        renderForm(req, res);
                    }
                } catch (error) {
                    renderFormExpired(req, res);
                }
            } else {
                // failed validation
                res.locals.errors = errors.array();
                res.locals.formValues = req.body;
                return renderForm(req, res);
            }
        }
    });

module.exports = router;
