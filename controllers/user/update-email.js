'use strict';
const path = require('path');
const get = require('lodash/fp/get');
const express = require('express');

const { Users } = require('../../db/models');
const { redirectForLocale } = require('../../common/urls');
const { csrfProtection } = require('../../middleware/cached');
const { requireUserAuth } = require('../../middleware/authed');
const { injectCopy } = require('../../middleware/inject-content');

const logger = require('../../common/logger').child({ service: 'user' });

const { emailOnly } = require('./lib/account-schemas');
const validateSchema = require('./lib/validate-schema');
const sendActivationEmail = require('./lib/activation-email');

const router = express.Router();

function render(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/update-email'), {
        csrfToken: req.csrfToken(),
        formValues: data,
        errors: errors
    });
}

async function handleSubmission(req, res, next) {

    const validationResult = validateSchema(
        emailOnly(req.i18n),
        req.body
    );

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
            const canUpdate =
                passwordMatches === true &&
                username !== get('username')(existingUser);

            if (canUpdate) {
                const userId = req.user.userData.id;
                await Users.updateNewEmail({
                    id: userId,
                    newEmail: username
                });
                const updatedUser = await Users.findByPk(userId);
                await sendActivationEmail(req, updatedUser);
                logger.info('Update email change successful');
                redirectForLocale(req, res, '/user?s=emailUpdated');
            } else {
                logger.warn(`Invalid credentials when updating email address`);

                /**
                 * Return a generic error to avoid exposing that a user
                 * exists with the requested email address
                 */
                render(req, res, validationResult.value, [
                    { msg: res.locals.copy.genericError }
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
    .all(requireUserAuth, csrfProtection, injectCopy('user.updateEmail'))
    .get(render)
    .post(handleSubmission);

module.exports = router;
