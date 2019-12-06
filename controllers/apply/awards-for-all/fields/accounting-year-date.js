'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions');

module.exports = function(locale) {
    const localise = get(locale);

    return {
        name: 'accountingYearDate',
        label: localise({
            en: 'What is your accounting year end date?',
            cy: 'Beth yw eich dyddiad gorffen blwyddyn ariannol?'
        }),
        explanation: localise({
            en: `<p><strong>For example: 31 03</strong></p>`,
            cy: '<p><strong>Er enghraifft: 31 03</strong></p>'
        }),
        type: 'day-month',
        isRequired: true,
        schema: Joi.when(Joi.ref('organisationStartDate.isBeforeMin'), {
            is: true,
            then: Joi.dayMonth().required(),
            otherwise: Joi.any().strip()
        }),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a day and month',
                    cy: 'Rhowch ddiwrnod a mis'
                })
            },
            {
                type: 'any.invalid',
                message: localise({
                    en: 'Enter a real day and month',
                    cy: 'Rhowch ddiwrnod a mis go iawn'
                })
            }
        ]
    };
};
