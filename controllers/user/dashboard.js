'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();
const { concat } = require('lodash');
const Raven = require('raven');

const { sendActivationEmail } = require('./helpers');
const { emailSchema, errorMessages } = require('./schema');
const userService = require('../../services/user');
const { csrfProtection } = require('../../middleware/cached');
const { requireUserAuth } = require('../../middleware/authed');
const { normaliseErrors } = require('../../modules/errors');

function renderUpdateEmailForm(req, res, data = null, errors = []) {
    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
        label: 'Update email address'
    });
    res.render(path.resolve(__dirname, './views/update-email'), {
        csrfToken: req.csrfToken(),
        formValues: data,
        errors: errors
    });
}

/**
 * Route: Generic user dashboard
 */
router.get('/', (req, res) => {
    let alertMessage;
    switch (req.query.s) {
        case 'passwordUpdated':
            alertMessage = 'Your password was successfully updated!';
            break;
        case 'activationSent':
            alertMessage = `We have sent an email to ${
                req.user.userData.username
            } with a link to activate your account.`;
            break;
        case 'activationComplete':
            alertMessage = `Your account was successfully activated!`;
            break;
        case 'emailUpdated':
            alertMessage = `Your email address was successfully updated!`;
            break;
    }

    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
        label: 'Dashboard'
    });

    res.render(path.resolve(__dirname, './views/dashboard'), {
        user: req.user,
        errors: res.locals.errors || [],
        alertMessage: alertMessage
    });
});

/**
 * Route: Update email address
 */
router
    .route('/update-email')
    .all(requireUserAuth, csrfProtection)
    .get(renderUpdateEmailForm)
    .post(async (req, res) => {
        const validationResult = emailSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        const errors = normaliseErrors({
            validationError: validationResult.error,
            errorMessages: errorMessages,
            locale: req.i18n.getLocale(),
            fieldNames: ['username']
        });

        if (errors.length > 0) {
            renderUpdateEmailForm(req, res, validationResult.value, errors);
        } else {
            try {
                const { username } = validationResult.value;
                const existingUser = await userService.findByUsername(username);
                if (existingUser) {
                    throw new Error('A user tried to update their email address to an existing email address');
                } else {
                    const userId = req.user.userData.id;
                    await userService.updateNewEmail({
                        newEmail: username,
                        id: userId
                    });
                    const updatedUser = await userService.findById(userId);
                    await sendActivationEmail(req, updatedUser, true);
                    res.redirect('/user?s=emailUpdated');
                }
            } catch (error) {
                Raven.captureException(error);
                res.locals.alertMessage = 'There was an error updating your details - please try again';
                renderUpdateEmailForm(req, res, validationResult.value);
            }
        }
    });

module.exports = router;
