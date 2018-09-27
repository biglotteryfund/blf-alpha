'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');
const { body, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');

const newsletterService = require('../../services/newsletter-service');
const { errorTranslator } = require('../../modules/validators');

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
                await newsletterService.subscribe({
                    addressBookId: '10926987',
                    subscriptionData: {
                        email: formData.email,
                        emailType: 'Html'
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
