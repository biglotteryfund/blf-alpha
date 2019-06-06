'use strict';
const path = require('path');
const express = require('express');
const Sentry = require('@sentry/node');

const { Users } = require('../../db/models');
const { sanitise } = require('../../common/validators');
const { csrfProtection } = require('../../middleware/cached');
const { requireUserAuth } = require('../../middleware/authed');
const {
    injectCopy,
    injectBreadcrumbs
} = require('../../middleware/inject-content');

const normaliseErrors = require('./lib/normalise-errors');
const schemas = require('./lib/account-schemas');
const sendActivationEmail = require('./lib/activation-email');

const router = express.Router();

function renderUpdateEmailForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/update-email'), {
        csrfToken: req.csrfToken(),
        formValues: data,
        errors: errors
    });
}

router
    .route('/')
    .all(
        requireUserAuth,
        csrfProtection,
        injectCopy('user.updateEmail'),
        injectBreadcrumbs
    )
    .get(renderUpdateEmailForm)
    .post(async (req, res) => {
        const validationResult = schemas.emailSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        const errors = normaliseErrors({
            errorDetails: validationResult.error.details,
            errorMessages: schemas.errorMessages(req.i18n.getLocale())
        });

        if (errors.length > 0) {
            renderUpdateEmailForm(req, res, validationResult.value, errors);
        } else {
            try {
                const username = sanitise(validationResult.value.username);
                const existingUser = await Users.findByUsername(username);

                if (existingUser) {
                    throw new Error(
                        `A user tried to update their email address to an existing email address`
                    );
                } else {
                    await Users.updateNewEmail({
                        newEmail: username,
                        id: req.user.id
                    });
                    const updatedUser = await Users.findById(req.user.id);
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
