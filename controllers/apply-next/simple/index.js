'use strict';
const { initFormRouter } = require('../form-router');

const formBuilder = require('./form');
const eligibilityBuilder = require('./eligibility');
const confirmationBuilder = require('./confirmation');
const { processor } = require('./processor');

module.exports = initFormRouter({
    id: 'awards-for-all',
    eligibilityBuilder: eligibilityBuilder,
    formBuilder: formBuilder,
    confirmationBuilder: confirmationBuilder,
    processor: processor
});
