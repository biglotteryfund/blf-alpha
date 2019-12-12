'use strict';
const { initFormRouter } = require('../form-router');

const formBuilder = require('./form');
const eligibilityBuilder = require('./eligibility');
const confirmationBuilder = require('./confirmation');

module.exports = initFormRouter({
    formId: 'dev-contacts-next',
    eligibilityBuilder: eligibilityBuilder,
    formBuilder: formBuilder,
    confirmationBuilder: confirmationBuilder
});
