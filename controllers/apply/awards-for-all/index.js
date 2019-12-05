'use strict';
const { initFormRouter } = require('../form-router');
const { EXPIRY_EMAIL_REMINDERS } = require('./constants');

module.exports = initFormRouter({
    formId: 'awards-for-all',
    eligibilityBuilder: require('./eligibility'),
    formBuilder: require('./form'),
    confirmationBuilder: require('./confirmation'),
    transformFunction: require('./transform'),
    expiryEmailPeriods: EXPIRY_EMAIL_REMINDERS
});
