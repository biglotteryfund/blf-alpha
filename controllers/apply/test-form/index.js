'use strict';
const { initFormRouter } = require('../form-router');

module.exports = initFormRouter({
    formId: 'test-form',
    formBuilder: require('./form')
});
