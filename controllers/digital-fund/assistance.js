'use strict';
const { body, validationResult } = require('express-validator/check');
const { concat } = require('lodash');
const { matchedData } = require('express-validator/filter');
const express = require('express');
const moment = require('moment');
const path = require('path');

const { DIGITAL_FUND_EMAIL } = require('../../modules/secrets');
const { errorTranslator } = require('../../modules/validators');
const { sendEmail } = require('../../services/mail');
const appData = require('../../modules/appData');

const translateError = errorTranslator('toplevel.ebulletin.errors');

const router = express.Router();

const validators = [
    body('email')
        .exists()
        .not()
        .isEmpty()
        .withMessage(translateError('emailMissing'))
        .isEmail()
        .withMessage(translateError('emailInvalid'))
];

function renderAlternativeFunding(req, res) {
    res.render(path.resolve(__dirname, './views/assistance'), {
        title: res.locals.copy.assistance.title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: res.locals.copy.assistance.title }])
    });
}

router
    .route('/')
    .get(renderAlternativeFunding)
    .post(validators, async (req, res) => {
        const formData = matchedData(req);
        const formErrors = validationResult(req);

        if (formErrors.isEmpty()) {
            try {
                await sendEmail({
                    name: 'digital_fund_assistance',
                    mailConfig: {
                        sendTo: appData.isNotProduction ? formData.email : DIGITAL_FUND_EMAIL,
                        subject: `New subscription: Help getting started with digital (${moment().format(
                            'Do MMMM YYYY, h:mm a'
                        )})`,
                        type: 'text',
                        content: `${formData.email} has requested more information about free digital assistance`
                    }
                });

                res.locals.status = 'SUBMISSION_SUCCESS';
                renderAlternativeFunding(req, res);
            } catch (error) {
                res.locals.status = 'SUBMISSION_ERROR';
                renderAlternativeFunding(req, res);
            }
        } else {
            res.locals.formData = formData;
            res.locals.errors = formErrors.array();
            renderAlternativeFunding(req, res);
        }
    });

module.exports = router;
