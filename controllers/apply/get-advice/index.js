'use strict';
const path = require('path');
const { initFormRouter } = require('../form-router-next');

const formBuilder = require('./form');

module.exports = initFormRouter({
    formId: 'get-advice',
    formBuilder: formBuilder,
    startTemplate: path.resolve(__dirname, './views/startpage.njk')
});
