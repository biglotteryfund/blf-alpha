'use strict';
const { pick } = require('lodash/fp');
const applicationService = require('../../../services/applications');
const mail = require('../../../modules/mail');

function formatDataForStorage(stepsWithValues) {
    const picks = {
        step: pick(['name', 'fieldsets']),
        fieldset: pick(['legend', 'fields']),
        field: pick(['label', 'name', 'value'])
    };

    return stepsWithValues.map(originalStep => {
        const step = picks.step(originalStep);
        step.fieldsets = step.fieldsets.map(originalFieldset => {
            const fieldset = picks.fieldset(originalFieldset);
            fieldset.fields = fieldset.fields.map(picks.field);
            return fieldset;
        });
        return step;
    });
}

module.exports = async function processor(formModel, formData) {
    const flatData = formModel.getStepValuesFlattened(formData);
    const stepsWithValues = formModel.getStepsWithValues(formData);

    const dataToStore = formatDataForStorage(stepsWithValues);
    const record = await applicationService.storeApplication(formModel.shortCode, dataToStore);

    const primaryAddress = flatData['email'];
    // @TODO determine an internal email address to send to for production environments
    const internalAddress = primaryAddress;

    await mail.generateAndSend([
        {
            name: 'building_connections_customer',
            sendTo: primaryAddress,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: 'Thank you for getting in touch with the Big Lottery Fund!',
            templateName: 'emails/applicationSummary',
            templateData: {
                referenceId: record.reference_id,
                summary: stepsWithValues,
                form: formModel
            }
        },
        {
            name: 'building_connections_internal',
            sendTo: internalAddress,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: `New Building Connections Fund application: ${record.reference_id}`,
            templateName: 'emails/applicationSummaryInternal',
            templateData: {
                referenceId: record.reference_id,
                summary: formModel.orderStepsForInternalUse(stepsWithValues),
                form: formModel
            }
        }
    ]);

    return Promise.resolve(record);
};
