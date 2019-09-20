'use strict';
const { initFormRouter } = require('../form-router-next');

const formBuilder = require('./form');

module.exports = initFormRouter({
    formId: 'get-advice',
    formBuilder: formBuilder
});
