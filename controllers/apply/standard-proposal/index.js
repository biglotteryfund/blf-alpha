'use strict';
const path = require('path');
const features = require('config').get('features');

const { initFormRouter } = require('../form-router');

const formBuilder = require('./form');
const confirmationBuilder = require('./confirmation');

module.exports = initFormRouter({
    formId: 'standard-enquiry',
    formBuilder: formBuilder,
    startTemplate: path.resolve(__dirname, './views/startpage.njk'),
    confirmationBuilder: confirmationBuilder,
    enableSalesforceConnector: features.enableSalesforceConnector,
    isBilingual: false
});
