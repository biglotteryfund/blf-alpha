'use strict';
const path = require('path');

const { generateHtmlEmail, sendEmail } = require('../../../services/mail');
const appData = require('../../../modules/appData');

const { determineInternalSendTo } = require('./helpers');

module.exports = async function processor({ form, data, stepsWithValues, copy, mailTransport = null }) {
    const customerSendTo = {
        name: `${data['first-name']} ${data['last-name']}`,
        address: data['email']
    };

    let organisationName = `${data['organisation-name']}`;
    if (data['additional-organisations']) {
        organisationName += ` (plus ${data['additional-organisations']})`;
    }

    const customerHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './customer-email.njk'),
        templateData: {
            data: data,
            stepsCopy: copy.steps,
            fieldsCopy: copy.fields,
            summary: stepsWithValues,
            isArray: xs => Array.isArray(xs)
        }
    });

    /**
     * This is slightly awkward but allows us to reorder the steps for internal use
     * We need to reorder both the steps and the copy to make sure the labels are in sync
     */
    const stepsCopy = copy.steps;
    const stepsCopyInternalOrder = [stepsCopy[3], stepsCopy[2], stepsCopy[1], stepsCopy[0]];
    const stepsWithValuesInternalOrder = [
        stepsWithValues[3],
        stepsWithValues[2],
        stepsWithValues[1],
        stepsWithValues[0]
    ];

    const internalHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './internal-email.njk'),
        templateData: {
            title: form.title,
            data: data,
            fieldsCopy: copy.fields,
            stepsCopy: stepsCopyInternalOrder,
            summary: stepsWithValuesInternalOrder,
            isArray: xs => Array.isArray(xs)
        }
    });

    return Promise.all([
        sendEmail({
            name: 'reaching_communities_customer',
            mailConfig: {
                sendTo: customerSendTo,
                subject: 'Thank you for getting in touch with the Big Lottery Fund!',
                type: 'html',
                content: customerHtml
            },
            mailTransport: mailTransport
        }),
        sendEmail({
            name: 'reaching_communities_internal',
            mailConfig: {
                sendTo: appData.isNotProduction ? customerSendTo : determineInternalSendTo(data.location),
                subject: `New idea submission from website: ${organisationName}`,
                type: 'html',
                content: internalHtml
            },
            mailTransport: mailTransport
        })
    ]);
};
