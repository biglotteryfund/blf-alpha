'use strict';
const express = require('express');
const passport = require('passport');
const path = require('path');
const Raven = require('raven');
const { matchedData } = require('express-validator/filter');
const { validationResult } = require('express-validator/check');

const { csrfProtection } = require('../../middleware/cached');
const { requireUnauthed } = require('../../middleware/authed');
const userService = require('../../services/user');

const { validators, sendActivationEmail } = require('./helpers');

const router = express.Router();

function renderForm(req, res) {
    res.render(path.resolve(__dirname, './views/register'), {
        csrfToken: req.csrfToken(),
        errors: res.locals.errors || []
    });
}

async function handleRegister(req, res, next) {
    const errors = validationResult(req);
    const data = matchedData(req, { locations: ['body'] });

    if (errors.isEmpty()) {
        const { username, password } = req.body;

        try {
            // check if this email address already exists
            // we can't use findOrCreate here because the password changes
            // each time we hash it, which sequelize sees as a new user :(
            const existingUser = await userService.findByUsername(username);

            if (existingUser) {
                throw new Error('A user tried to register with an existing email address');
            } else {
                const newUser = await userService.createUser({
                    username: username,
                    password: password,
                    level: 0
                });

                // Success! now send them an activation email
                const activationData = await sendActivationEmail(req, newUser);

                if (req.body.returnToken) {
                    // used for tests to verify activation works
                    res.send(activationData);
                } else {
                    passport.authenticate('local', (authError, authUser) => {
                        if (authError) {
                            next(authError);
                        } else {
                            req.logIn(authUser, loginErr => {
                                if (loginErr) {
                                    next(loginErr);
                                } else {
                                    res.redirect('/user?s=activationSent');
                                }
                            });
                        }
                    })(req, res, next);
                }
            }
        } catch (error) {
            Raven.captureException(error);
            res.locals.alertMessage = 'There was an error creating your account - please try again';
            renderForm(req, res);
        }
    } else {
        // failed validation
        res.locals.errors = errors.array();
        res.locals.formValues = data;
        return renderForm(req, res);
    }
}

router
    .route('/')
    .all(requireUnauthed, csrfProtection)
    .get(renderForm)
    .post([validators.emailAddress, validators.password], handleRegister);

module.exports = router;
