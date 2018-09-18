'use strict';
const path = require('path');
const express = require('express');
const Raven = require('raven');
const { body, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');

const { customEvent } = require('../../modules/analytics');
const { FORM_STATES } = require('../../modules/forms');
const { purifyUserInput, errorTranslator } = require('../../modules/validators');
const cached = require('../../middleware/cached');
const newsletterService = require('../../services/newsletter-service');

const router = express.Router();

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
    .all(cached.noCache)
    .get((req, res) => {
        renderForm({ res });
    })
    .post(formValidators, async (req, res) => {
        for (let key in req.body) {
            req.body[key] = purifyUserInput(req.body[key]);
        }

        const formData = matchedData(req);
        const formErrors = validationResult(req);

        if (formErrors.isEmpty()) {
            const handleSignupError = errMsg => {
                Raven.captureMessage(errMsg || 'Error with ebulletin');
                renderForm({
                    res: res,
                    formStatus: FORM_STATES.SUBMISSION_ERROR,
                    formData: formData
                });
            };

            const subscriptionData = {
                email: formData.email,
                emailType: 'Html',
                dataFields: [
                    { key: 'FIRSTNAME', value: formData.firstName },
                    { key: 'LASTNAME', value: formData.lastName },
                    { key: formData.location, value: 'yes' }
                ]
            };

            if (formData.organisation) {
                subscriptionData.dataFields.push({ key: 'ORGANISATION', value: formData.organisation });
            }

            try {
                await newsletterService.subscribe({
                    addressBookId: '589755',
                    subscriptionData: subscriptionData
                });

                renderForm({
                    res: res,
                    formStatus: FORM_STATES.SUBMISSION_SUCCESS,
                    formData: formData
                });
            } catch (error) {
                return handleSignupError(error.message || error);
            }
        } else {
            renderForm({
                res: res,
                formStatus: FORM_STATES.VALIDATION_ERROR,
                formData: formData,
                formErrors: formErrors.array()
            });
        }
    });

module.exports = router;
