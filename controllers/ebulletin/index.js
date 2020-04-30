'use strict';
const path = require('path');
const express = require('express');
const Sentry = require('@sentry/node');
const omit = require('lodash/omit');

const { newContact, buildValidLocations } = require('./lib/contact-schema');

const { noStore, csrfProtection } = require('../../common/cached');
const { sanitiseRequestBody } = require('../../common/sanitise');
const validateSchema = require('../../common/validate-schema');
const newsletterService = require('../../common/ebulletin');
const logger = require('../../common/logger').child({ service: 'ebulletin' });

const router = express.Router();

function subscribe(formData) {
    const subscriptionData = {
        email: formData.email,
        emailType: 'Html',
        dataFields: [
            { key: 'FirstName', value: formData.firstName },
            { key: 'LastName', value: formData.lastName },
        ]
    };

    return newsletterService.subscribe({
        addressBookId: '148374',
        subscriptionData: subscriptionData
    });
}

function renderForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/ebulletin'), {
        title: req.i18n.__('toplevel.ebulletin.title'),
        csrfToken: req.csrfToken(),
        validLocations: buildValidLocations(req.i18n),
        formValues: data,
        errors: errors,
    });
}

router
    .route('/')
    .all(noStore, csrfProtection)
    .get(renderForm)
    .post(async function handleEbulletinSignup(req, res) {

        const sanitisedBody = sanitiseRequestBody(omit(req.body, ['_csrf']));

        const validationResult = validateSchema(
            newContact(req.i18n),
            sanitisedBody
        );

        if (validationResult.isValid) {
            try {
                await subscribe(validationResult.value);
                res.locals.status = 'SUCCESS';
                renderForm(req, res);
            } catch (error) {
                res.locals.status = 'ERROR';
                logger.warn('Registration failed: ', error);
                Sentry.captureException(error);
                renderForm(req, res);
            }
        } else {
            renderForm(req, res, validationResult.value, validationResult.messages);
        }
    });

module.exports = router;
