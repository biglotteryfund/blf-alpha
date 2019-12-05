'use strict';
const { initFormRouter } = require('../form-router');
const { EXPIRY_EMAIL_REMINDERS } = require('./constants');

const formBuilder = require('./form');
const eligibilityBuilder = require('./eligibility');
const confirmationBuilder = require('./confirmation');
const { transform } = require('./transforms');

module.exports = initFormRouter({
    formId: 'awards-for-all',
    eligibilityBuilder: eligibilityBuilder,
    formBuilder: formBuilder(),
    confirmationBuilder: confirmationBuilder,
    transformFunction: transform,
    expiryEmailPeriods: EXPIRY_EMAIL_REMINDERS
});
