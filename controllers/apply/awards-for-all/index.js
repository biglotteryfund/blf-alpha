'use strict';
const { initFormRouter } = require('../form-router-next');

const formBuilder = require('./form');
const eligibilityBuilder = require('./eligibility');
const confirmationBuilder = require('./confirmation');
const { EXPIRY_EMAIL_REMINDERS } = require('./constants');

module.exports = initFormRouter({
    formId: 'awards-for-all',
    eligibilityBuilder: eligibilityBuilder,
    formBuilder: formBuilder,
    confirmationBuilder: confirmationBuilder,
    expiryEmailPeriods: EXPIRY_EMAIL_REMINDERS
});
