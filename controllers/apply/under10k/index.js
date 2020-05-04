'use strict';
const path = require('path');

const { initFormRouter } = require('../form-router');

const formBuilder = require('./form');
const eligibilityBuilder = require('./eligibility');
const confirmationBuilder = require('./confirmation');
const { EXPIRY_EMAIL_REMINDERS } = require('./constants');

module.exports = initFormRouter({
    formId: 'awards-for-all',
    eligibilityBuilder: eligibilityBuilder,
    formBuilder: formBuilder,
    startTemplate: path.resolve(__dirname, './views/startpage.njk'),
    confirmationBuilder: confirmationBuilder,
    expiryEmailPeriods: EXPIRY_EMAIL_REMINDERS,
});
