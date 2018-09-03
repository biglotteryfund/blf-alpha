'use strict';
const path = require('path');

const mail = require('../../../services/mail');
const appData = require('../../../modules/appData');

const { determineInternalSendTo, orderStepsForInternalUse } = require('./helpers');

module.exports = function processor({ form, data, stepsWithValues }) {
    const customerSendTo = {
        name: `${data['first-name']} ${data['last-name']}`,
        address: data['email']
    };

    let organisationName = `${data['organisation-name']}`;
    if (data['additional-organisations']) {
        organisationName += ` (plus ${data['additional-organisations']})`;
    }

    return mail.generateAndSend([
        {
            name: 'reaching_communities_customer',
            sendTo: customerSendTo,
            subject: 'Thank you for getting in touch with the Big Lottery Fund!',
            template: path.resolve(__dirname, './customer-email'),
            templateData: {
                data: data,
                summary: stepsWithValues
            }
        },
        {
            name: 'reaching_communities_internal',
            sendTo: appData.isNotProduction ? customerSendTo : determineInternalSendTo(data.location),
            subject: `New idea submission from website: ${organisationName}`,
            template: path.resolve(__dirname, './internal-email'),
            templateData: {
                title: form.title,
                data: data,
                summary: orderStepsForInternalUse(stepsWithValues)
            }
        }
    ]);
};
