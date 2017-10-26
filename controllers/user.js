'use strict';
const express = require('express');
const router = express.Router();
const xss = require('xss');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const models = require('../models/index');
const routeStatic = require('./utils/routeStatic');
const auth = require('../modules/authed');
const secrets = require('../modules/secrets');
const mail = require('../modules/mail');

const attemptAuth = (req, res, next) =>
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        } else {
            req.logIn(user, err => {
                if (err) {
                    // user not valid, send them to login again
                    req.flash('formErrors', [{ msg: info.message }]);
                    req.flash('formValues', req.body);
                    req.session.save(() => {
                        return res.redirect('/user/login');
                    });
                } else {
                    // user is valid, send them on
                    // we don't use flash here because it gets unset in the GET route above
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
router.get('/dashboard', auth.requireAuthed, (req, res) => {
    res.cacheControl = { maxAge: 0 };
    res.render('user/dashboard', {
        user: req.user
    });
});

// register users
// @TODO add password verification field
// @TODO don't expose whether an account already exists or not
// eg. "Your username and password combination is invalid"
routeStatic.injectUrlRequest(router, '/register');
router
    .route('/register')
    .get(auth.requireUnauthed, (req, res) => {
        res.cacheControl = { maxAge: 0 };
        res.render('user/login-or-register', {
            mode: 'register'
        });
    })
    .post((req, res, next) => {
        const handleSignupError = msg => {
            if (!msg) {
                msg = 'Error registering your details - please try again';
            }
            req.flash('formErrors', [{ msg: msg }]);
            req.session.save(() => {
                res.redirect('/user/register');
            });
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
                // return the user to the form to correct errors
                req.flash('formErrors', result.array());
                req.flash('formValues', req.body);
                req.session.save(() => {
                    res.redirect('/user/register');
                });
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
                                    let activateUrl = `${req.protocol}://${req.headers.host}/user/activate/${token}`;
                                    mail.send(
                                        'Activate your Big Lottery Fund website account',
                                        `Please click the following link to activate your account: ${activateUrl}`,
                                        email
                                    );
                                    attemptAuth(req, res, next);
                                })
                                .catch(err => {
                                    // error on user insert
                                    console.error('Error creating a new user', err);
                                    handleSignupError();
                                });
                        } else {
                            // this user already exists
                            handleSignupError('That username is already taken');
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

// activate an account
router.get('/activate/:token', (req, res) => {
    res.cacheControl = { maxAge: 0 };

    // @TODO should we check if they're already active here?
    // or should they already be logged in, and we can check the JWT user ID matches theirs?
    jwt.verify(req.params.token, secrets['user.jwt.secret'], (err, decoded) => {
        if (err) {
            // @TODO handle this - should allow them to re-send
            res.send(err);
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
                        // @TODO handle this
                        res.send(err);
                    });
            } else {
                // @TODO handle this
                res.send('error');
            }
        }
    });
});

/* password reset
 *
 * user enters email address
 * verify account exists
 * email them a token to allow them to reset a password (short expiry)
 * should token contain the account or should that only be in the email?
 * tell them they were emailed a link
 * link verifies token and allows password reset
 * email them to confirm it worked
 * handle timeouts
 */

const passwordResetError = (req, res, errMsg) => {
    req.flash('formErrors', [{ msg: errMsg }]);
    req.session.save(() => {
        return res.redirect('/user/resetpassword');
    });
};

routeStatic.injectUrlRequest(router, '/resetpassword');
router
    .route('/resetpassword')
    .get((req, res) => {
        res.cacheControl = { maxAge: 0 };

        let token = req.query.token;

        // is this a password reset link?
        if (token) {
            jwt.verify(token, secrets['user.jwt.secret'], (err, decoded) => {
                if (err) {
                    // @TODO handle this - should allow them to re-send
                    res.send(err);
                } else {
                    if (decoded.data.reason === 'resetpassword') {
                        // we can now reset password

                        // @TODO check user is in reset state

                        res.render('user/login-or-register', {
                            mode: 'resetpasswordconfirmed',
                            error: req.flash('error')
                        });

                        // models.Users
                        //     .update(
                        //         {
                        //             password: newPassword
                        //         },
                        //         {
                        //             where: {
                        //                 id: id
                        //             }
                        //         }
                        //     )
                        //     .then(() => {
                        //         callback(null);
                        //     })
                        //     .catch(err => {
                        //         callback(err);
                        //     });
                    } else {
                        // @TODO handle this
                        res.send('error');
                    }
                }
            });
        } else {
            res.render('user/login-or-register', {
                mode: 'resetpassword',
                error: req.flash('error')
            });
        }
    })
    .post((req, res) => {
        const email = xss(req.body.username);
        if (!email) {
            return passwordResetError(req, res, 'Please provide your email address');
        } else {
            // @TODO we use this a lot, make it a function
            models.Users
                .findOne({ where: { username: email } })
                .then(user => {
                    if (!user) {
                        // no user found
                        return passwordResetError(req, res, 'Your email address is not valid');
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
                    return passwordResetError(req, res, 'There was an error fetching your details');
                });
        }
    });

// login users
routeStatic.injectUrlRequest(router, '/login');
router
    .route('/login')
    .get(auth.requireUnauthed, (req, res) => {
        res.cacheControl = { maxAge: 0 };
        res.render('user/login-or-register', {
            mode: 'login',
            error: req.flash('error')
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

module.exports = router;
