'use strict';
const { initFormRouter } = require('../form-router');

const formBuilder = require('./form');
const confirmationBuilder = require('./confirmation');

module.exports = initFormRouter({
    formId: 'dev-contacts-next',
    formBuilder: formBuilder,
    confirmationBuilder: confirmationBuilder
});
