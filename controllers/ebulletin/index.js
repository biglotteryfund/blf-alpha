'use strict';
const path = require('path');
const express = require('express');
const Raven = require('raven');
const { body, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const rp = require('request-promise-native');
const config = require('config');

const { customEvent } = require('../../modules/analytics');
const { DOTMAILER_API } = require('../../modules/secrets');
const { FORM_STATES } = require('../../modules/forms');
const { injectCopy } = require('../../middleware/inject-content');
const { noCache } = require('../../middleware/cached');
const { purifyUserInput, errorTranslator } = require('../../modules/validators');

const router = express.Router();

function subscribeToNewsletter(formData) {
    const dataToSend = {
        email: formData.email,
        emailType: 'Html',
        dataFields: [
            {
                key: 'FIRSTNAME',
                value: formData.firstName
            },
            {
                key: 'LASTNAME',
                value: formData.lastName
            },
            {
                key: formData.location,
                value: 'yes'
            }
        ]
    };

    // optional fields
    if (formData.organisation) {
        dataToSend.dataFields.push({
            key: 'ORGANISATION',
            value: formData.organisation
        });
    }

    const ADDRESS_BOOK_ID = 589755;
    const ENDPOINT = `${config.get('ebulletinApiEndpoint')}/address-books/${ADDRESS_BOOK_ID}/contacts`;

    return rp({
        uri: ENDPOINT,
        method: 'POST',
        auth: {
            user: DOTMAILER_API.user,
            pass: DOTMAILER_API.password,
            sendImmediately: true
        },
        json: true,
        body: dataToSend,
        resolveWithFullResponse: true
    });
}

const translateError = errorTranslator('toplevel.ebulletin.errors');
const formValidators = [
    body('firstName')
        .exists()
        .not()
        .isEmpty()
        .withMessage(translateError('firstName')),
    body('lastName')
        .exists()
        .not()
        .isEmpty()
        .withMessage(translateError('lastName')),
    body('email')
        .exists()
        .not()
        .isEmpty()
        .withMessage(translateError('emailMissing'))
        .isEmail()
        .withMessage(translateError('emailInvalid')),
    body('location')
        .exists()
        .withMessage(translateError('location'))
];

function renderForm({ res, formStatus = FORM_STATES.NOT_SUBMITTED, formData = null, formErrors = [] }) {
    res.render(path.resolve(__dirname, './views/ebulletin'), {
        status: formStatus,
        data: formData,
        errors: formErrors
    });
}

router
    .route('/')
    .all(noCache, injectCopy('toplevel.ebulletin'))
    .get((req, res) => {
        renderForm({ res });
    })
    .post(formValidators, (req, res) => {
        for (let key in req.body) {
            req.body[key] = purifyUserInput(req.body[key]);
        }

        const formData = matchedData(req);
        const formErrors = validationResult(req);

        if (!formErrors.isEmpty()) {
            renderForm({
                res: res,
                formStatus: FORM_STATES.VALIDATION_ERROR,
                formData: formData,
                formErrors: formErrors.array()
            });
        } else {
            const handleSignupSuccess = () => {
                customEvent('emailNewsletter', 'signup', formData.location);
                renderForm({
                    res: res,
                    formStatus: FORM_STATES.SUBMISSION_SUCCESS,
                    formData: formData
                });
            };

            const handleSignupError = errMsg => {
                Raven.captureMessage(errMsg || 'Error with ebulletin');
                renderForm({
                    res: res,
                    formStatus: FORM_STATES.SUBMISSION_ERROR,
                    formData: formData
                });
            };

            subscribeToNewsletter(formData)
                .then(response => {
                    if (response.statusCode === 200) {
                        handleSignupSuccess();
                    } else {
                        return handleSignupError(response.message);
                    }
                })
                .catch(error => {
                    return handleSignupError(error.message || error);
                });
        }
    });

module.exports = router;
