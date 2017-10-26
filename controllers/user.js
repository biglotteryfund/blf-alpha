'use strict';
const express = require('express');
const router = express.Router();
const xss = require('xss');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const { body, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');

const models = require('../models/index');
const routeStatic = require('./utils/routeStatic');
const auth = require('../modules/authed');
const secrets = require('../modules/secrets');
const mail = require('../modules/mail');

const userBasePath = '/user';
const userEndpoints = {
    dashboard: '/dashboard',
    register: '/register',
    login: '/login',
    logout: '/logout',
    activate: '/activate',
    resetpassword: '/resetpassword'
};

// convert a single error string into a list
// or return an express-validator pre-formatted list
const makeErrorList = error => {
    if (_.isArray(error)) {
        return error;
    } else {
        return [
            {
                msg: error
            }
        ];
    }
};

// generic function to return the user to the form with an error
const renderUserError = (msg, req, res, path) => {
    if (msg) {
        req.flash('formErrors', makeErrorList(msg));
    }
    req.session.save(() => {
        return res.redirect(userBasePath + path);
    });
};

// try to validate a user's login request
// @TODO consider rate limiting?
const attemptAuth = (req, res, next) =>
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        } else {
            req.logIn(user, err => {
                if (err) {
                    // user not valid, send them to login again
                    req.flash('formValues', req.body);
                    req.flash('formErrors', makeErrorList(info.message));
                    req.session.save(() => {
                        return res.redirect('/user/login');
                    });
                } else {
                    // user is valid, send them on
                    // we don't use flash here because it gets unset in the GET route above
                    // @TODO is this still true?
                    let redirectUrl = '/user/dashboard';
                    if (req.body.redirectUrl) {
                        redirectUrl = req.body.redirectUrl;
                    } else if (req.session.redirectUrl) {
                        redirectUrl = req.session.redirectUrl;
                        delete req.session.redirectUrl;
                    }
                    req.session.save(() => {
                        res.redirect(redirectUrl);
                    });
                }
            });
        }
    })(req, res, next);

// serve a logged-in user's dashboard
routeStatic.injectUrlRequest(router, userEndpoints.dashboard);
router.get(userEndpoints.dashboard, auth.requireAuthed, (req, res) => {
    res.cacheControl = { maxAge: 0 };
    res.render('user/dashboard', {
        user: req.user
    });
});

// email users with an activation code
const sendActivationEmail = (user, req, isBrandNewUser) => {
    // only the current user can do this
    // (or if it's a brand new, not-logged-in-yet user)
    if (isBrandNewUser || (req.user.id === user.id && !req.user.is_active)) {
        // redirect them to login after email
        let token = jwt.sign(
            {
                data: {
                    userId: user.id,
                    reason: 'activate'
                }
            },
            secrets['user.jwt.secret'],
            {
                expiresIn: '7d' // allow a week to activate
            }
        );
        let email = user.username;
        let activateUrl = `${req.protocol}://${req.headers.host}/user/activate?token=${token}`;
        mail.send(
            'Activate your Big Lottery Fund website account',
            `Please click the following link to activate your account: ${activateUrl}`,
            email
        );
    }
};

// configure form validation
const PASSWORD_MIN_LENGTH = 8;
const emailPasswordValidations = [
    body('username')
        .exists()
        .not()
        .isEmpty()
        .withMessage('Please provide your email address')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .exists()
        .not()
        .isEmpty()
        .withMessage('Please provide a password')
        .isLength({ min: PASSWORD_MIN_LENGTH })
        .withMessage(`Please provide a password that is longer than ${PASSWORD_MIN_LENGTH} characters`)
        .matches(/\d/)
        .withMessage('Please provide a password that contains at least one number')
];

// register users
routeStatic.injectUrlRequest(router, userEndpoints.register);
router
    .route(userEndpoints.register)
    .get(auth.requireUnauthed, (req, res) => {
        res.cacheControl = { maxAge: 0 };
        res.render('user/register');
    })
    .post(emailPasswordValidations, (req, res, next) => {
        const errors = validationResult(req);
        const data = matchedData(req, { locations: ['body'] });

        if (!errors.isEmpty()) {
            // failed validation
            // return the user to the form to correct errors
            req.flash('formErrors', errors.array());
            req.flash('formValues', data);
            req.session.save(() => {
                res.redirect(userBasePath + userEndpoints.register);
            });
        } else {
            let userData = {
                username: xss(req.body.username),
                password: xss(req.body.password),
                level: 0
            };

            let genericRegistrationFailMsg = 'Your registration request could not be completed - please try again.';

            // check if this email address already exists
            // we can't use findOrCreate here because the password changes
            // each time we hash it, which sequelize sees as a new user :(
            models.Users
                .findOne({ where: { username: userData.username } })
                .then(user => {
                    if (!user) {
                        // no user found, so make a new one
                        models.Users
                            .create(userData)
                            .then(newUser => {
                                // success! now send them an activation email
                                sendActivationEmail(newUser, req, true);
                                req.flash('activationSent', true);
                                attemptAuth(req, res, next);
                            })
                            .catch(err => {
                                // error on user insert
                                console.error('Error creating a new user', err);
                                renderUserError(genericRegistrationFailMsg, req, res, userEndpoints.register);
                            });
                    } else {
                        // this user already exists
                        console.error('A user tried to register with an existing email address');
                        // send a generic message - don't expose existing accounts
                        renderUserError(genericRegistrationFailMsg, req, res, userEndpoints.register);
                    }
                })
                .catch(err => {
                    // error on user lookup
                    console.error('Error looking up user', err);
                    renderUserError(genericRegistrationFailMsg, req, res, userEndpoints.register);
                });
        }
    });

// login users
routeStatic.injectUrlRequest(router, userEndpoints.login);
router
    .route(userEndpoints.login)
    .get(auth.requireUnauthed, (req, res) => {
        res.cacheControl = { maxAge: 0 };
        res.render('user/login');
    })
    .post((req, res, next) => {
        attemptAuth(req, res, next);
    });

// logout users
router.get(userEndpoints.logout, (req, res) => {
    res.cacheControl = { maxAge: 0 };
    req.logout();
    // @TODO maybe add a flash token to inform they were logged out?
    req.session.save(() => {
        res.redirect(userBasePath + userEndpoints.login);
    });
});

// activate an account
router.get(userEndpoints.activate, auth.requireAuthed, (req, res) => {
    res.cacheControl = { maxAge: 0 };

    let token = req.query.token;

    if (!token) {
        // no token, so send them an activation email
        req.flash('activationSent', true);
        sendActivationEmail(req.user, req);
        req.session.save(() => {
            res.redirect(userBasePath + userEndpoints.dashboard);
        });
    } else {
        // validate the token
        jwt.verify(token, secrets['user.jwt.secret'], (err, decoded) => {
            if (err) {
                console.error('A user tried to use an expired activation token', err);
                req.flash('activationInvalid', true);
                renderUserError(null, req, res, userEndpoints.dashboard);
            } else {
                // is this user already active?
                if (req.user.is_active) {
                    req.flash('genericError', 'Your account is already active!');
                    return renderUserError(null, req, res, userEndpoints.dashboard);
                }

                // was the token valid for this user?
                if (decoded.data.reason === 'activate' && decoded.data.userId === req.user.id) {
                    // activate the user (their token is valid)
                    models.Users
                        .update(
                            {
                                is_active: true
                            },
                            {
                                where: {
                                    id: decoded.data.userId
                                }
                            }
                        )
                        .then(() => {
                            res.redirect('/user/dashboard');
                        })
                        .catch(err => {
                            console.error("Failed to update a user's activation status", err);
                            req.flash('genericError', 'There was an error activating your account - please try again');
                            renderUserError(null, req, res, userEndpoints.dashboard);
                        });
                } else {
                    // token was tampered with
                    console.error('A user tried to activate an account with an invalid token');
                    req.flash('genericError', 'There was an error activating your account - please try again');
                    renderUserError(null, req, res, userEndpoints.dashboard);
                }
            }
        });
    }
});

// route to allow resetting password
// (either sending reset emails, or updating database)
routeStatic.injectUrlRequest(router, userEndpoints.resetpassword);
router
    .route(userEndpoints.resetpassword)
    .get(auth.requireUnauthed, (req, res) => {
        res.cacheControl = { maxAge: 0 };

        let token = req.query.token;

        // is this a password reset link?
        if (!token) {
            res.render('user/resetpassword', {
                mode: 'enterEmail'
            });
        } else {
            // a user has followed a reset link
            console.log('got a toke');
            jwt.verify(token, secrets['user.jwt.secret'], (err, decoded) => {
                if (err) {
                    console.error('Password reset token expired', err);
                    req.flash('genericError', 'Your password reset period has expired - please try again');
                    return renderUserError(null, req, res, userEndpoints.resetpassword);
                } else {
                    if (decoded.data.reason === 'resetpassword') {
                        // we can now show the reset password form
                        res.render('user/resetpassword', {
                            mode: 'pickNewPassword',
                            token: token
                        });
                    } else {
                        console.error('Password reset token invalid', err);
                        req.flash('genericError', 'Your password reset link was invalid - please try again');
                        return renderUserError(null, req, res, userEndpoints.resetpassword);
                    }
                }
            });
        }
    })
    .post(auth.requireUnauthed, (req, res) => {
        let hasPickedNewPassword = req.body.token;

        if (!hasPickedNewPassword) {
            // the user wants to trigger a reset email
            const email = xss(req.body.username);
            if (!email) {
                req.flash('genericError', 'Please provide a valid email address');
                return renderUserError(null, req, res, userEndpoints.resetpassword);
            } else {
                models.Users
                    .findOne({
                        where: {
                            username: email
                        }
                    })
                    .then(user => {
                        if (!user) {
                            // no user found / user not in password reset mode
                            req.flash('genericError', 'Please provide a valid email address');
                            return renderUserError(null, req, res, userEndpoints.resetpassword);
                        } else {
                            // this user exists, send email
                            let token = jwt.sign(
                                {
                                    data: {
                                        userId: user.id,
                                        reason: 'resetpassword'
                                    }
                                },
                                secrets['user.jwt.secret'],
                                {
                                    expiresIn: '1h' // short-lived token
                                }
                            );
                            let resetUrl = `${req.protocol}://${req.headers.host}/user/resetpassword?token=${token}`;

                            mail.send(
                                'Reset the password for your Big Lottery Fund website account',
                                `Please click the following link to reset your password: ${resetUrl}`,
                                email
                            );

                            // mark this user as in password reset mode
                            models.Users
                                .update(
                                    {
                                        is_password_reset: true
                                    },
                                    {
                                        where: {
                                            id: user.id
                                        }
                                    }
                                )
                                .then(() => {
                                    req.flash('passwordRequestSent', true);
                                    req.session.save(() => {
                                        res.redirect(userBasePath + userEndpoints.login);
                                    });
                                })
                                .catch(err => {
                                    console.error('Error marking user as in password reset mode', err);
                                    req.flash('genericError', 'There was an error requesting your password reset');
                                    return renderUserError(null, req, res, userEndpoints.resetpassword);
                                });
                        }
                    })
                    .catch(err => {
                        // error on user lookup
                        console.error('Error looking up user', err);
                        req.flash('genericError', 'There was an error fetching your details');
                        return renderUserError(null, req, res, userEndpoints.resetpassword);
                    });
            }
        } else {
            // @TODO enforce password constraints
            if (!req.body.password) {
                // @TODO include the token here
                req.flash('genericError', 'Please choose a valid password');
                return renderUserError(null, req, res, userEndpoints.resetpassword);
            } else {
                // check the token again
                jwt.verify(req.body.token, secrets['user.jwt.secret'], (err, decoded) => {
                    if (err) {
                        console.error('Password reset token expired', err);
                        req.flash('genericError', 'Your password reset period has expired - please try again');
                        // @TODO include the token here
                        return renderUserError(null, req, res, userEndpoints.resetpassword);
                    } else {
                        if (decoded.data.reason === 'resetpassword') {
                            // is this user in password update mode?
                            models.Users
                                .findOne({
                                    where: {
                                        id: decoded.data.userId,
                                        is_password_reset: true
                                    }
                                })
                                .then(user => {
                                    if (!user) {
                                        // no user for this ID, or they already did this reset
                                        console.error('A user tried to reset a password using a pre-used token');
                                        req.flash(
                                            'genericError',
                                            'There was an error updating your password - please try again'
                                        );
                                        // @TODO include the token here
                                        return renderUserError(null, req, res, userEndpoints.resetpassword);
                                    } else {
                                        // this user exists and requested this change
                                        let newPassword = req.body.password;
                                        models.Users
                                            .update(
                                                {
                                                    password: newPassword,
                                                    is_password_reset: false
                                                },
                                                {
                                                    where: {
                                                        id: decoded.data.userId
                                                    }
                                                }
                                            )
                                            .then(() => {
                                                req.flash('passwordUpdated', true);
                                                req.session.save(() => {
                                                    res.redirect(userBasePath + userEndpoints.login);
                                                });
                                            })
                                            .catch(err => {
                                                console.error('Error updating a user password', err);
                                                req.flash(
                                                    'genericError',
                                                    'There was an error updating your password - please try again'
                                                );
                                                // @TODO include the token here
                                                return renderUserError(null, req, res, userEndpoints.resetpassword);
                                            });
                                    }
                                })
                                .catch(err => {
                                    console.error('Error fetching a user password change status', err);
                                    req.flash(
                                        'genericError',
                                        'There was an error updating your password - please try again'
                                    );
                                    // @TODO include the token here
                                    return renderUserError(null, req, res, userEndpoints.resetpassword);
                                });
                        } else {
                            console.error('A user tried to reset a password with an invalid token');
                            req.flash('genericError', 'There was an error updating your password - please try again');
                            // @TODO include the token here
                            return renderUserError(null, req, res, userEndpoints.resetpassword);
                        }
                    }
                });
            }
        }
    });

module.exports = router;
