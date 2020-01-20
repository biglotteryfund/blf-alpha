'use strict';
const path = require('path');

const { initFormRouter } = require('../form-router');

const formBuilder = require('./form');
const confirmationBuilder = require('./confirmation');
const { EXPIRY_EMAIL_REMINDERS } = require('./constants');

module.exports = initFormRouter({
    formId: 'standard-enquiry',
    formBuilder: formBuilder,
    startTemplate: path.resolve(__dirname, './views/startpage.njk'),
    confirmationBuilder: confirmationBuilder,
    isBilingual: false,
    expiryEmailPeriods: EXPIRY_EMAIL_REMINDERS
});
