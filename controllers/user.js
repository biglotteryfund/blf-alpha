'use strict';
const express = require('express');
const router = express.Router();
const xss = require('xss');
const passport = require('passport');
const config = require('config');
const activator = require('activator');
const path = require('path');

const models = require('../models/index');
const routeStatic = require('./utils/routeStatic');
const auth = require('../modules/authed');
const secrets = require('../modules/secrets');
const mail = require('../modules/mail');

activator.init({
    user: {
        find: (id, callback) => {
            models.Users
                .findOne({ where: { id: id } })
                .then(user => {
                    if (user) {
                        callback(null, user);
                    } else {
                        callback(null, null);
                    }
                })
                .catch(err => {
                    callback(err, null);
                });
        },
        activate: (id, callback) => {
            models.Users
                .update(
                    {
                        is_active: true
                    },
                    {
                        where: {
                            id: id
                        }
                    }
                )
                .then(() => {
                    callback(null);
                })
                .catch(err => {
                    callback(err);
                });
        },
        setPassword: (id, newPassword, callback) => {
            models.Users
                .update(
                    {
                        password: newPassword
                    },
                    {
                        where: {
                            id: id
                        }
                    }
                )
                .then(() => {
                    callback(null);
                })
                .catch(err => {
                    callback(err);
                });
        }
    },
    emailProperty: 'username',
    transport: mail.transport,
    templates: activator.templates.file(path.join(__dirname, '../views/emails')),
    from: config.get('emailSender'),
    signkey: secrets['user.jwt.secret']
});

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
                                    req.activator = {
                                        id: newUser.id
                                    };
                                    // redirect them to login after email
                                    activator.createActivateNext(req, res, () => {
                                        attemptAuth(req, res, next);
                                    });
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
                        res.send(err);
                        console.error('Error looking up user', err);
                        handleSignupError();
                    });
            }
        });
    });

// activate an account
router.get('/activate/:user', activator.completeActivateNext, (req, res) => {
    res.redirect('/user/dashboard');
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
