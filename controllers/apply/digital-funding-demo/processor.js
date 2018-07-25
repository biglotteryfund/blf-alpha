'use strict';
const mail = require('../../../modules/mail');

module.exports = function processor(form, formData) {
    const flatData = form.getStepValuesFlattened(formData);
    const summary = form.getStepsWithValues(formData);

    /**
     * Construct a primary address (i.e. customer email)
     */
    const primaryAddress = `${flatData['first-name']} ${flatData['last-name']} <${flatData['email']}>`;

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
        }
    ]);
};
