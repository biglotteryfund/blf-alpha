'use strict';
const express = require('express');
const moment = require('moment');
const path = require('path');
const Joi = require('@hapi/joi');
const Sentry = require('@sentry/node');

const { DIGITAL_FUND_EMAIL } = require('../../common/secrets');
const { sendEmail } = require('../../common/mail');
const { isNotProduction } = require('../../common/appData');

const router = express.Router();

function render(req, res, formData = null, errors = []) {
    const title = res.locals.copy.assistance.title;
    res.render(path.resolve(__dirname, './views/assistance'), {
        title: title,
        breadcrumbs: res.locals.breadcrumbs.concat([{ label: title }]),
        formData: formData,
        errors: errors
    });
}

function buildMailConfig(emailAddress) {
    const dateStamp = moment().format('Do MMMM YYYY, h:mm a');
    return {
        sendTo: isNotProduction ? emailAddress : DIGITAL_FUND_EMAIL,
        subject: `New subscription: Help getting started with digital (${dateStamp})`,
        type: 'text',
        content: `${emailAddress} has requested more information about free digital assistance`
    };
}

router
    .route('/')
    .get(render)
    .post(async (req, res) => {
        const validationResult = Joi.object({
            email: Joi.string()
                .email()
                .required()
        }).validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (validationResult.error) {
            const errors = [
                {
                    param: 'email',
                    msg: req.i18n.__('global.forms.invalidEmailError')
                }
            ];
            render(req, res, validationResult.value, errors);
        } else {
            try {
                await sendEmail({
                    name: 'digital_fund_assistance',
                    mailConfig: buildMailConfig(validationResult.value.email)
                });

                res.locals.status = 'SUBMISSION_SUCCESS';
                render(req, res);
            } catch (error) {
                Sentry.captureException(error);
                res.locals.status = 'SUBMISSION_ERROR';
                render(req, res);
            }
        }
    });

module.exports = router;
