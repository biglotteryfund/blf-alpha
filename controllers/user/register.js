const xss = require('xss');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');

const models = require('../../models/index');
const secrets = require('../../modules/secrets');
const mail = require('../../modules/mail');
const { userBasePath, userEndpoints, makeUserLink, renderUserError } = require('./utils');
const login = require('./login');

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
        let activatePath = makeUserLink('activate');
        let activateUrl = `${req.protocol}://${req.headers.host}${activatePath}?token=${token}`;
        mail.send(
            'Activate your Big Lottery Fund website account',
            `Please click the following link to activate your account: ${activateUrl}`,
            email
        );
    }
};

const registrationForm = (req, res) => {
    res.cacheControl = { maxAge: 0 };
    res.render('user/register', {
        makeUserLink: makeUserLink
    });
};

const createUser = (req, res, next) => {
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
                            login.attemptAuth(req, res, next);
                        })
                        .catch(err => {
                            // error on user insert
                            console.error('Error creating a new user', err);
                            renderUserError(genericRegistrationFailMsg, req, res, makeUserLink('register'));
                        });
                } else {
                    // this user already exists
                    console.error('A user tried to register with an existing email address');
                    // send a generic message - don't expose existing accounts
                    renderUserError(genericRegistrationFailMsg, req, res, makeUserLink('register'));
                }
            })
            .catch(err => {
                // error on user lookup
                console.error('Error looking up user', err);
                renderUserError(genericRegistrationFailMsg, req, res, makeUserLink('register'));
            });
    }
};

const activateUser = (req, res) => {
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
                renderUserError(null, req, res, makeUserLink('dashboard'));
            } else {
                // is this user already active?
                if (req.user.is_active) {
                    req.flash('genericError', 'Your account is already active!');
                    return renderUserError(null, req, res, makeUserLink('dashboard'));
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
                            res.redirect(makeUserLink('dashboard'));
                        })
                        .catch(err => {
                            console.error("Failed to update a user's activation status", err);
                            req.flash('genericError', 'There was an error activating your account - please try again');
                            renderUserError(null, req, res, makeUserLink('dashboard'));
                        });
                } else {
                    // token was tampered with
                    console.error('A user tried to activate an account with an invalid token');
                    req.flash('genericError', 'There was an error activating your account - please try again');
                    renderUserError(null, req, res, makeUserLink('dashboard'));
                }
            }
        });
    }
};

module.exports = {
    registrationForm,
    createUser,
    activateUser
};
