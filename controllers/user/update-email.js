'use strict';
const path = require('path');
const express = require('express');

const { localify } = require('../../common/urls');
const { csrfProtection } = require('../../common/cached');
const { requireUserAuth } = require('../../common/authed');
const logger = require('../../common/logger').child({ service: 'user' });
const validateSchema = require('../../common/validate-schema');

const { Users } = require('../../db/models');

const { emailOnly } = require('./lib/account-schemas');
const sendActivationEmail = require('./lib/activation-email');

const router = express.Router();

function render(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/update-email'), {
        title: req.i18n.__('user.updateEmail.title'),
        csrfToken: req.csrfToken(),
        formValues: data,
        errors: errors,
    });
}

async function handleSubmission(req, res, next) {
    const validationResult = validateSchema(emailOnly(req.i18n), req.body);

    if (validationResult.isValid) {
        try {
            const { username } = validationResult.value;
            const existingUser = await Users.findByUsername(username);
            const passwordMatches = await Users.checkValidPassword(
                req.user.userData.password,
                req.body.password
            );

            /**
             * Allow updating if the password confirmation matches
             * and there is not an existing user with the requested email address
             */
            const canUpdate = passwordMatches === true && !existingUser;

            if (canUpdate) {
                const userId = req.user.userData.id;
                await Users.updateNewEmail({
                    id: userId,
                    newEmail: username,
                });
                const updatedUser = await Users.findByPk(userId);
                await sendActivationEmail(req, updatedUser);
                logger.info('Update email change successful');
                res.redirect(
                    localify(req.i18n.getLocale())('/user?s=emailUpdated')
                );
            } else {
                logger.warn(`Invalid credentials when updating email address`);

                /**
                 * Return a generic error to avoid exposing that a user
                 * exists with the requested email address
                 */
                render(req, res, validationResult.value, [
                    { msg: req.i18n.__('user.updateEmail.genericError') },
                ]);
            }
        } catch (error) {
            next(error);
        }
    } else {
        render(req, res, validationResult.value, validationResult.messages);
    }
}

router
    .route('/')
    .all(requireUserAuth, csrfProtection)
    .get(render)
    .post(handleSubmission);

module.exports = router;
