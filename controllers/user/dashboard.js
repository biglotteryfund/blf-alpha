'use strict';
const path = require('path');
const express = require('express');
const Sentry = require('@sentry/node');

const userService = require('../../services/user');
const { csrfProtection } = require('../../middleware/cached');
const { requireUserAuth } = require('../../middleware/authed');
const { addAlertMessage } = require('../../middleware/user');
const {
    injectCopy,
    injectBreadcrumbs
} = require('../../middleware/inject-content');

const normaliseErrors = require('./lib/normalise-errors');
const schema = require('./schema');
const { sendActivationEmail } = require('./helpers');

const router = express.Router();

function renderUpdateEmailForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/update-email'), {
        csrfToken: req.csrfToken(),
        formValues: data,
        errors: errors
    });
}

/**
 * Route: Generic user dashboard
 */
router.get(
    '/',
    requireUserAuth,
    injectCopy('user.dashboard'),
    addAlertMessage,
    (req, res) => {
        res.render(path.resolve(__dirname, './views/dashboard'), {
            errors: res.locals.errors || []
        });
    }
);

/**
 * Route: Update email address
 */
router
    .route('/update-email')
    .all(
        requireUserAuth,
        csrfProtection,
        injectCopy('user.updateEmail'),
        injectBreadcrumbs
    )
    .get(renderUpdateEmailForm)
    .post(async (req, res) => {
        const validationResult = schema.emailSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        const errors = normaliseErrors({
            errorDetails: validationResult.error.details,
            errorMessages: schema.errorMessages(req.i18n.getLocale())
        });

        if (errors.length > 0) {
            renderUpdateEmailForm(req, res, validationResult.value, errors);
        } else {
            try {
                const { username } = validationResult.value;
                const existingUser = await userService.findByUsername(username);
                if (existingUser) {
                    throw new Error(
                        `A user tried to update their email address to an existing email address`
                    );
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
                Sentry.captureException(error);
                const genericErrors = [
                    {
                        msg: `There was an error updating your details - please try again`
                    }
                ];
                renderUpdateEmailForm(
                    req,
                    res,
                    validationResult.value,
                    genericErrors
                );
            }
        }
    });

module.exports = router;
