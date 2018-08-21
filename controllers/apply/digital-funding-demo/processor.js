'use strict';
const mail = require('../../../modules/mail');
const appData = require('../../../modules/appData');
const { DIGITAL_FUND_DEMO_EMAIL } = require('../../../modules/secrets');

module.exports = function processor(form, formData) {
    const flatData = form.getStepValuesFlattened(formData);
    const summary = form.getStepsWithValues(formData);

    /**
     * Construct a primary address (i.e. customer email)
     */
    const primaryAddress = `${flatData['first-name']} ${flatData['last-name']} <${flatData['email']}>`;
    const organisationName = `${flatData['organisation-name']}`;

    return mail.generateAndSend([
        {
            name: 'digital_funding_demo_customer',
            sendTo: primaryAddress,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: 'Thank you for getting in touch with the Big Lottery Fund!',
            templateName: 'emails/applicationSummary',
            templateData: {
                summary: summary,
                form: form,
                data: flatData
            }
        },
        {
            name: 'digital_funding_demo_internal',
            sendTo: appData.isDev ? primaryAddress : DIGITAL_FUND_DEMO_EMAIL,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: `New Digital Fund idea submission from website: ${organisationName}`,
            templateName: 'emails/applicationSummaryInternal',
            templateData: {
                summary: form.orderStepsForInternalUse(summary),
                form: form,
                data: flatData
            }
        }
    ]);
};
