'use strict';
const path = require('path');

const { isNotProduction } = require('../../../common/appData');

const { initFormRouter } = require('../form-router');

const formBuilder = require('./form');
const eligibilityBuilder = require('./eligibility');
const confirmationBuilder = require('./confirmation');
const { EXPIRY_EMAIL_REMINDERS } = require('./constants');
const { transform } = require('./transforms');

function getStartTemplate() {
    return isNotProduction
        ? path.resolve(__dirname, './views/startpage.njk')
        : null;
}

module.exports = initFormRouter({
    formId: 'awards-for-all',
    eligibilityBuilder: eligibilityBuilder,
    formBuilder: formBuilder,
    startTemplate: getStartTemplate(),
    confirmationBuilder: confirmationBuilder,
    transformFunction: transform,
    expiryEmailPeriods: EXPIRY_EMAIL_REMINDERS
});
