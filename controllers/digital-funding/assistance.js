'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');
const { body, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');

const newsletterService = require('../../services/newsletter-service');

const router = express.Router();

const validators = [
    body('email')
        .exists()
        .not()
        .isEmpty()
        .withMessage('Please provide your email address')
        .isEmail()
        .withMessage('Please provide a valid email address')
];

function renderAlternativeFunding(req, res) {
    const title = 'Help getting started with digital';
    res.render(path.resolve(__dirname, './views/assistance'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: title }])
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
