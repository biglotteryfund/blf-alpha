'use strict';
const path = require('path');
const { isDev } = require('../../../common/appData');
const { initFormRouter } = require('../form-router-next');

const formBuilder = require('./form');
const confirmationBuilder = require('./confirmation');

module.exports = initFormRouter({
    formId: 'standard-enquiry',
    formBuilder: formBuilder,
    startTemplate: path.resolve(__dirname, './views/startpage.njk'),
    confirmationBuilder: confirmationBuilder,
    enableSalesforceConnector: isDev
});
