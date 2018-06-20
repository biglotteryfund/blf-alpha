'use strict';
const mail = require('../../../modules/mail');

module.exports = function processor(formModel, formData) {

    const flatData = formModel.getStepValuesFlattened(formData);
    const summary = formModel.getStepsWithValues(formData);

    /**
     * Construct a primary address (i.e. customer email)
     */
    const primaryAddress = `${flatData['first-name']} ${flatData['last-name']} <${flatData['email']}>`;
    const organisationName = `${flatData['organisation-name']}`;

    // @TODO determine an internal email address to send to for production environments

    return mail.generateAndSend([
        {
            name: 'building_connections_customer',
            sendTo: primaryAddress,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: 'Thank you for getting in touch with the Big Lottery Fund!',
            templateName: 'emails/applicationSummary',
            templateData: {
                summary: summary,
                form: formModel,
                data: flatData
            }
        },
        {
            name: 'building_connections_internal',
            sendTo: primaryAddress,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: `New idea submission from website: ${organisationName}`,
            templateName: 'emails/applicationSummaryInternal',
            templateData: {
                summary: formModel.orderStepsForInternalUse(summary),
                form: formModel,
                data: flatData
            }
        }
    ]);

    // return Promise.resolve(formData);
};
