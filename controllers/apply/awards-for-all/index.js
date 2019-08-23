'use strict';
const { isNotProduction } = require('../../../common/appData');
const { initFormRouter } = require('../form-router-next');

const formBuilder = require('./form');
const eligibilityBuilder = require('./eligibility');
const confirmationBuilder = require('./confirmation');

module.exports = initFormRouter({
    formId: 'awards-for-all',
    isBilingual: isNotProduction,
    eligibilityBuilder: eligibilityBuilder,
    formBuilder: formBuilder,
    confirmationBuilder: confirmationBuilder
});
