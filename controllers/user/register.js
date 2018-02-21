const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');

const mail = require('../../modules/mail');
const { JWT_SIGNING_TOKEN } = require('../../modules/secrets');
const userService = require('../../services/user');

const { userBasePath, userEndpoints, makeUserLink, makeErrorList, trackError } = require('./utils');
const login = require('./login');
const dashboard = require('./dashboard');

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
            JWT_SIGNING_TOKEN,
            {
                expiresIn: '7d' // allow a week to activate
            }
        );
        let email = user.username;
        let activatePath = makeUserLink('activate');
        let activateUrl = `${req.protocol}://${req.headers.host}${activatePath}?token=${token}`;
        let emailData = {
            subject: 'Activate your Big Lottery Fund website account',
            text: `Please click the following link to activate your account: ${activateUrl}`,
            sendTo: email
        };

        // @TODO should we alert users to errors here?
        mail.send(emailData);

        return {
            email: emailData,
            token: token
        };
    }
};

const registrationForm = (req, res) => {
    res.render('user/register', {
        csrfToken: req.csrfToken(),
        makeUserLink: makeUserLink,
        errors: res.locals.errors || []
    });
};

const createUser = (req, res, next) => {
    const errors = validationResult(req);
    const data = matchedData(req, { locations: ['body'] });

    if (!errors.isEmpty()) {
        // failed validation
        // return the user to the form to correct errors
        req.flash('formValues', data);
        res.locals.errors = errors.array();
        req.session.save(() => {
            return registrationForm(req, res);
        });
    } else {
        const { username, password } = req.body;
        // check if this email address already exists
        // we can't use findOrCreate here because the password changes
        // each time we hash it, which sequelize sees as a new user :(
        userService
            .findByUsername(username)
            .then(user => {
                if (!user) {
                    // no user found, so make a new one
                    userService
                        .createUser({
                            username: username,
                            password: password,
                            level: 0
                        })
                        .then(newUser => {
                            // success! now send them an activation email
                            let activationData = sendActivationEmail(newUser, req, true);
                            if (req.body.returnToken) {
                                // used for tests to verify activation works
                                res.send(activationData);
                            } else {
                                req.flash('activationSent', true);
                                login.attemptAuth(req, res, next);
                            }
                        })
                        .catch(() => {
                            // error on user insert
                            trackError('Error creating a new user');
                            res.locals.errors = makeErrorList(
                                'There was an error creating your account - please try again'
                            );
                            return registrationForm(req, res);
                        });
                } else {
                    // this user already exists
                    trackError('A user tried to register with an existing email address');
                    // send a generic message - don't expose existing accounts
                    res.locals.errors = makeErrorList('There was an error creating your account - please try again');
                    return registrationForm(req, res);
                }
            })
            .catch(() => {
                // error on user lookup
                trackError('Error looking up user');
                res.locals.errors = makeErrorList('There was an error creating your account - please try again');
                return registrationForm(req, res);
            });
    }
};

const activateUser = (req, res) => {
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
        jwt.verify(token, JWT_SIGNING_TOKEN, (err, decoded) => {
            if (err) {
                trackError('A user tried to use an expired activation token');
                res.locals.errors = makeErrorList('There was an error with this activation link - please try again');
                return dashboard.dashboard(req, res);
            } else {
                // is this user already active?
                if (req.user.is_active) {
                    res.locals.errors = makeErrorList('Your account is already active!');
                    return dashboard.dashboard(req, res);
                }

                // was the token valid for this user?
                if (decoded.data.reason === 'activate' && decoded.data.userId === req.user.id) {
                    // activate the user (their token is valid)
                    userService
                        .updateActivateUser({
                            id: decoded.data.userId
                        })
                        .then(() => {
                            res.redirect(makeUserLink('dashboard'));
                        })
                        .catch(() => {
                            trackError("Failed to update a user's activation status");
                            res.locals.errors = makeErrorList(
                                'There was an error with this activation link - please try again'
                            );
                            return dashboard.dashboard(req, res);
                        });
                } else {
                    // token was tampered with
                    trackError('A user tried to activate an account with an invalid token');
                    res.locals.errors = makeErrorList(
                        'There was an error with this activation link - please try again'
                    );
                    return dashboard.dashboard(req, res);
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
