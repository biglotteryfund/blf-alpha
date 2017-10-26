'use strict';
const express = require('express');
const router = express.Router();
const xss = require('xss');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

const models = require('../models/index');
const routeStatic = require('./utils/routeStatic');
const auth = require('../modules/authed');
const secrets = require('../modules/secrets');
const mail = require('../modules/mail');

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

// send the user back to the dashboard with the relevant error
const showUserError = (req, res, error, mode) => {
    if (error) {
        req.flash('formErrors', makeErrorList(error));
    }
    req.flash('userMode', mode);
    req.session.save(() => {
        return res.redirect('/user/dashboard');
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
                    showUserError(req, res, info.message, 'login');
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
routeStatic.injectUrlRequest(router, '/dashboard');
router.get('/dashboard', (req, res) => {
    res.cacheControl = { maxAge: 0 };
    let mode = req.flash('userMode') || 'dashboard';
    if (mode === 'dashboard' && !req.user) {
        res.redirect('/user/login');
    } else {
        res.render('user/dashboard', {
            user: req.user,
            errors: req.flash('formErrors'),
            mode: mode
        });
    }
});

// register users
routeStatic.injectUrlRequest(router, '/register');
router
    .route('/register')
    .get(auth.requireUnauthed, (req, res) => {
        res.cacheControl = { maxAge: 0 };
        res.render('user/dashboard', {
            mode: 'register'
        });
    })
    .post((req, res, next) => {
        const handleSignupError = msg => {
            if (!msg) {
                msg = 'Error registering your details - please try again';
            }
            showUserError(req, res, msg, 'register');
        };

        let userData = {
            username: xss(req.body.username),
            password: xss(req.body.password),
            level: 0
        };

        // validate the form input
        // @TODO add some password requirements here
        const minChars = 8;
        req
            .checkBody('username', 'Please provide a valid email address')
            .notEmpty()
            .isEmail();
        req
            .checkBody('password', `Please provide a valid password (minimum ${minChars} characters long)`)
            .notEmpty()
            .isLength({ min: minChars });

        req.getValidationResult().then(result => {
            if (!result.isEmpty()) {
                // failed validation
                // return the user to the form to correct errors
                req.flash('formValues', req.body);
                showUserError(req, res, result.array(), 'register');
            } else {
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
                                    // redirect them to login after email
                                    let token = jwt.sign(
                                        {
                                            data: {
                                                userId: newUser.id,
                                                reason: 'activate'
                                            }
                                        },
                                        secrets['user.jwt.secret'],
                                        {
                                            expiresIn: '7d' // allow a week to activate
                                        }
                                    );
                                    let email = newUser.username;
                                    let activateUrl = `${req.protocol}://${req.headers
                                        .host}/user/activate?token=${token}`;
                                    mail.send(
                                        'Activate your Big Lottery Fund website account',
                                        `Please click the following link to activate your account: ${activateUrl}`,
                                        email
                                    );
                                    req.flash('activationSent', true);
                                    attemptAuth(req, res, next);
                                })
                                .catch(err => {
                                    // error on user insert
                                    console.error('Error creating a new user', err);
                                    handleSignupError();
                                });
                        } else {
                            // this user already exists
                            console.error('A user tried to register with an existing email address');
                            // send a generic message - don't expose existing accounts
                            handleSignupError();
                        }
                    })
                    .catch(err => {
                        // error on user lookup
                        console.error('Error looking up user', err);
                        handleSignupError();
                    });
            }
        });
    });

// login users
routeStatic.injectUrlRequest(router, '/login');
router
    .route('/login')
    .get(auth.requireUnauthed, (req, res) => {
        res.cacheControl = { maxAge: 0 };
        res.render('user/dashboard', {
            mode: 'login'
        });
    })
    .post((req, res, next) => {
        attemptAuth(req, res, next);
    });

// logout users
router.get('/logout', (req, res) => {
    res.cacheControl = { maxAge: 0 };
    req.logout();
    res.redirect('/user/login');
});

// activate an account
router.get('/activate', (req, res) => {
    res.cacheControl = { maxAge: 0 };

    let token = req.query.token;

    if (!token) {
        res.redirect('/user/dashboard');
    } else {
        // @TODO should we check if they're already active here?
        // or should they already be logged in, and we can check the JWT user ID matches theirs?
        jwt.verify(token, secrets['user.jwt.secret'], (err, decoded) => {
            if (err) {
                console.error('A user tried to use an expired activation token', err);
                showUserError(req, res, false, 'activatetokenexpired');
            } else {
                if (decoded.data.reason === 'activate') {
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
                            showUserError(
                                req,
                                res,
                                'There was an error activating your account - please try again',
                                'activatetokenexpired'
                            );
                        });
                } else {
                    console.error('A user tried to activate an account with an invalid token');
                    showUserError(
                        req,
                        res,
                        'There was an error activating your account - please try again',
                        'activatetokenexpired'
                    );
                }
            }
        });
    }
});

routeStatic.injectUrlRequest(router, '/resetpassword');
router
    .route('/resetpassword')
    .get((req, res) => {
        res.cacheControl = { maxAge: 0 };

        let token = req.query.token;

        // is this a password reset link?
        if (!token) {
            res.render('user/dashboard', {
                mode: 'resetpassword'
            });
        } else {
            jwt.verify(token, secrets['user.jwt.secret'], (err, decoded) => {
                if (err) {
                    console.error('Password reset token expired', err);
                    showUserError(
                        req,
                        res,
                        'Your password reset period has expired - please try again',
                        'resettokenexpired'
                    );
                } else {
                    if (decoded.data.reason === 'resetpassword') {
                        // @TODO check user is in reset state
                        // we can now show the reset password form
                        res.render('user/dashboard', {
                            mode: 'resetpasswordconfirmed',
                            error: req.flash('error'),
                            token: token
                        });
                    } else {
                        console.error('Password reset token invalid', err);
                        showUserError(
                            req,
                            res,
                            'Your password reset link was invalid - please try again',
                            'resettokenexpired'
                        );
                    }
                }
            });
        }
    })
    .post((req, res) => {
        let hasToken = req.body.token;

        if (!hasToken) {
            // the user wants to trigger a reset email
            const email = xss(req.body.username);
            if (!email) {
                showUserError(req, res, 'Please provide a valid email address', 'resetpassword');
            } else {
                models.Users
                    .findOne({ where: { username: email } })
                    .then(user => {
                        if (!user) {
                            // no user found
                            showUserError(req, res, 'Please provide a valid email address', 'resetpassword');
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
                            // @TODO mark user as in reset mode
                            // @TODO view update
                            res.send('email sent');
                        }
                    })
                    .catch(err => {
                        // error on user lookup
                        console.error('Error looking up user', err);
                        showUserError(req, res, 'There was an error fetching your details', 'resetpassword');
                    });
            }
        } else {
            // @TODO enforce password constraints
            if (!req.body.password) {
                showUserError(req, res, 'Please choose a valid password', 'resetpassword');
            } else {
                // check the token again
                jwt.verify(req.body.token, secrets['user.jwt.secret'], (err, decoded) => {
                    if (err) {
                        console.error('Password reset token expired', err);
                        showUserError(
                            req,
                            res,
                            'Your password reset period has expired - please try again',
                            'resettokenexpired'
                        );
                    } else {
                        if (decoded.data.reason === 'resetpassword') {
                            let newPassword = req.body.password;
                            models.Users
                                .update(
                                    {
                                        password: newPassword
                                    },
                                    {
                                        where: {
                                            id: decoded.data.userId
                                        }
                                    }
                                )
                                .then(() => {
                                    res.send('pw updated!');
                                })
                                .catch(err => {
                                    res.send(err);
                                });
                        } else {
                            console.error('A user tried to reset a password with an invalid token');
                            showUserError(
                                req,
                                res,
                                'There was an error updating your password - please try again',
                                'resettokenexpired'
                            );
                        }
                    }
                });
            }
        }
    });

module.exports = router;
