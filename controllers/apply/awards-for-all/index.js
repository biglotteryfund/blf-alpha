'use strict';
const { isDev } = require('../../../common/appData');
const { initFormRouter } = require('../form-router-next');

const formBuilder = require('./form');
const eligibilityBuilder = require('./eligibility');
const confirmationBuilder = require('./confirmation');

module.exports = initFormRouter({
    formId: 'awards-for-all',
    isBilingual: isDev, // @TODO: Re-enable when Welsh has been added
    eligibilityBuilder: eligibilityBuilder,
    formBuilder: formBuilder,
    confirmationBuilder: confirmationBuilder
});
