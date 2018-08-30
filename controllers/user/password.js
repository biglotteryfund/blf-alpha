'use strict';
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator/check');

const mail = require('../../modules/mail');
const { purifyUserInput } = require('../../modules/validators');
const { JWT_SIGNING_TOKEN } = require('../../modules/secrets');
const userService = require('../../services/user');
const { userBasePath, userEndpoints, makeUserLink, makeErrorList, trackError, STATUSES } = require('./utils');

const requestResetForm = (req, res) => {
    res.render('user/resetpassword', {
        mode: 'enterEmail',
        makeUserLink: makeUserLink,
        errors: res.locals.errors || []
    });
};

// is this user in password update mode?
const checkUserRequestedPasswordReset = (userId, callbackSuccess, callbackError) => {
    userService
        .findWithActivePasswordReset({
            id: userId
        })
        .then(user => {
            if (!user) {
                // no user for this ID, or they already did this reset
                return callbackError();
            } else {
                return callbackSuccess(user);
            }
        })
        .catch(err => {
            callbackError(err);
        });
};

const changePasswordForm = (req, res) => {
    let token = req.query.token ? req.query.token : res.locals.token;
    if (!token) {
        return res.redirect(userBasePath + userEndpoints.login);
    }

    // a user has followed a reset link
    jwt.verify(token, JWT_SIGNING_TOKEN, (err, decoded) => {
        if (err) {
            trackError('Password reset token expired or invalid signature');
            // send them to start of the reset process (otherwise this is an endless loop)
            res.locals.errors = makeErrorList('Your password reset period has expired - please try again');
            return requestResetForm(req, res);
        } else {
            if (decoded.data.reason === 'resetpassword') {
                // now check if this user actually requested this
                checkUserRequestedPasswordReset(
                    decoded.data.userId,
                    () => {
                        // we can now show the reset password form
                        return res.render('user/resetpassword', {
                            mode: 'pickNewPassword',
                            token: token,
                            makeUserLink: makeUserLink,
                            errors: res.locals.errors || []
                        });
                    },
                    () => {
                        trackError('User attempted to reset a password for an non-resettable user');
                        res.locals.errors = makeErrorList('Your password reset link was invalid - please try again');
                        return requestResetForm(req, res);
                    }
                );
            } else {
                trackError('Password reset token was for another reason');
                res.locals.errors = makeErrorList('Your password reset link was invalid - please try again');
                return requestResetForm(req, res);
            }
        }
    });
};

const sendResetEmail = (req, res) => {
    // the user wants to trigger a reset email
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // failed validation
        res.locals.errors = errors.array();
        res.locals.formValues = req.body;
        return requestResetForm(req, res);
    } else {
        const email = purifyUserInput(req.body.username);
        userService
            .findByUsername(email)
            .then(user => {
                if (!user) {
                    // no user found / user not in password reset mode
                    res.locals.errors = makeErrorList('Please provide a valid email address');
                    return requestResetForm(req, res);
                } else {
                    // this user exists, send email
                    let token = jwt.sign(
                        {
                            data: {
                                userId: user.id,
                                reason: 'resetpassword'
                            }
                        },
                        JWT_SIGNING_TOKEN,
                        {
                            expiresIn: '1h' // short-lived token
                        }
                    );

                    let resetPath = makeUserLink('resetpassword');
                    let resetUrl = `${req.protocol}://${req.headers.host}${resetPath}?token=${token}`;

                    let sendEmail = mail.send({
                        name: 'user_password_reset',
                        subject: 'Reset the password for your Big Lottery Fund website account',
                        text: `Please click the following link to reset your password: ${resetUrl}`,
                        sendTo: email
                    });

                    sendEmail.catch(() => {
                        trackError('Error emailing user with password reset link');
                        res.locals.errors = makeErrorList('There was an error sending your password reset link');
                        return requestResetForm(req, res);
                    });

                    // mark this user as in password reset mode
                    userService
                        .updateIsInPasswordReset({
                            id: user.id
                        })
                        .then(() => {
                            const statusParam = `?s=${STATUSES.PASSWORD_RESET_REQUESTED}`;
                            res.redirect(userBasePath + userEndpoints.login + statusParam);
                        })
                        .catch(() => {
                            trackError('Error marking user as in password reset mode');
                            res.locals.errors = makeErrorList('There was an error requesting your password reset');
                            return requestResetForm(req, res);
                        });
                }
            })
            .catch(() => {
                // error on user lookup
                trackError('Error looking up user to reset email');
                res.locals.errors = makeErrorList('There was an error fetching your details');
                return requestResetForm(req, res);
            });
    }
};

const updatePassword = (req, res) => {
    let changePasswordToken = req.body.token;

    if (!changePasswordToken) {
        res.redirect(userBasePath + userEndpoints.login);
    } else {
        // store the token to pass on to other requests (eg. outside the URL)
        res.locals.token = changePasswordToken;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // failed validation
            res.locals.errors = errors.array();
            res.locals.formValues = req.body;
            return changePasswordForm(req, res);
        } else {
            // check the token again
            jwt.verify(changePasswordToken, JWT_SIGNING_TOKEN, (err, decoded) => {
                if (err) {
                    trackError('Password reset token expired or invalid');
                    res.locals.errors = makeErrorList('Your password reset period has expired - please try again');
                    return requestResetForm(req, res);
                } else {
                    if (decoded.data.reason === 'resetpassword') {
                        checkUserRequestedPasswordReset(
                            decoded.data.userId,
                            user => {
                                // this user exists and requested this change
                                let newPassword = req.body.password;
                                userService
                                    .updateNewPassword({
                                        id: user.id,
                                        newPassword: newPassword
                                    })
                                    .then(() => {
                                        const statusParam = `?s=${STATUSES.PASSWORD_UPDATED}`;
                                        res.redirect(userBasePath + userEndpoints.login + statusParam);
                                    })
                                    .catch(() => {
                                        trackError('Error updating a user password');
                                        res.locals.errors = makeErrorList(
                                            'There was an error updating your password - please try again'
                                        );
                                        return requestResetForm(req, res);
                                    });
                            },
                            () => {
                                trackError('Error processing a user password change status');
                                res.locals.errors = makeErrorList(
                                    'There was an error updating your password - please try again'
                                );
                                return requestResetForm(req, res);
                            }
                        );
                    } else {
                        trackError('A user tried to reset a password with an invalid token');
                        res.locals.errors = makeErrorList(
                            'There was an error updating your password - please try again'
                        );
                        return requestResetForm(req, res);
                    }
                }
            });
        }
    }
};

module.exports = {
    requestResetForm,
    sendResetEmail,
    changePasswordForm,
    updatePassword
};
