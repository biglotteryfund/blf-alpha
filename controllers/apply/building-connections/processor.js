'use strict';
const { pick } = require('lodash/fp');
const mail = require('../../../modules/mail');
const request = require('request-promise-native');
const { APPLICATIONS_SERVICE_ENDPOINT } = require('../../../modules/secrets');

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

    const record = await request.post(APPLICATIONS_SERVICE_ENDPOINT, {
        json: {
            formId: formModel.id,
            shortCode: formModel.shortCode,
            applicationData: dataToStore
        }
    });

    const referenceId = record.data.id;

    const primaryAddress = flatData['email'];
    // @TODO determine an internal email address to send to for production environments
    // const internalAddress = primaryAddress;

    await mail.generateAndSend([
        {
            name: 'building_connections_customer',
            sendTo: primaryAddress,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: 'Thank you for getting in touch with the Big Lottery Fund!',
            templateName: 'emails/applicationSummary',
            templateData: {
                referenceId: referenceId,
                summary: stepsWithValues,
                form: formModel
            }
        }
        // {
        //     name: 'building_connections_internal',
        //     sendTo: internalAddress,
        //     sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
        //     subject: `New Building Connections Fund application: ${referenceId}`,
        //     templateName: 'emails/applicationSummaryInternal',
        //     templateData: {
        //         referenceId: referenceId,
        //         summary: formModel.orderStepsForInternalUse(stepsWithValues),
        //         form: formModel
        //     }
        // }
    ]);

    return Promise.resolve(record);
};
