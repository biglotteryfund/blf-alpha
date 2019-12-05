'use strict';
const path = require('path');

const { initFormRouter } = require('../form-router');

module.exports = initFormRouter({
    formId: 'standard-enquiry',
    formBuilder: require('./form'),
    startTemplate: path.resolve(__dirname, './views/startpage.njk'),
    confirmationBuilder: require('./confirmation'),
    isBilingual: false
});
