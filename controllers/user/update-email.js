'use strict';
const path = require('path');
const express = require('express');
const Sentry = require('@sentry/node');

const { Users } = require('../../db/models');
const { redirectForLocale } = require('../../common/urls');
const { csrfProtection } = require('../../middleware/cached');
const { requireUserAuth } = require('../../middleware/authed');
const {
    injectCopy,
    injectBreadcrumbs
} = require('../../middleware/inject-content');

const logger = require('../../common/logger').child({
    service: 'user'
});

const schemas = require('./lib/account-schemas');
const validateSchema = require('./lib/validate-schema');
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
        const validationResult = validateSchema(
            schemas.emailOnly(req.i18n.getLocale()),
            req.body
        );

        const genericErrors = [{ msg: res.locals.copy.genericError }];

        if (validationResult.isValid) {
            try {
                const { username } = validationResult.value;
                const existingUser = await Users.findByUsername(username);
                if (existingUser) {
                    logger.info('Email address already in use');
                    Sentry.withScope(scope => {
                        scope.setLevel('info');
                        Sentry.captureMessage(
                            'A user tried to update their email address to an existing email address'
                        );
                    });

                    renderUpdateEmailForm(
                        req,
                        res,
                        validationResult.value,
                        genericErrors
                    );
                } else {
                    const userId = req.user.userData.id;
                    await Users.updateNewEmail({
                        id: userId,
                        newEmail: username
                    });
                    const updatedUser = await Users.findById(userId);
                    await sendActivationEmail(req, updatedUser, true);
                    logger.info('Update email change successful');
                    redirectForLocale(req, res, '/user?s=emailUpdated');
                }
            } catch (error) {
                logger.warn('Update email failed', error);
                Sentry.captureException(error);

                renderUpdateEmailForm(
                    req,
                    res,
                    validationResult.value,
                    genericErrors
                );
            }
        } else {
            renderUpdateEmailForm(
                req,
                res,
                validationResult.value,
                validationResult.messages
            );
        }
    });

module.exports = router;
