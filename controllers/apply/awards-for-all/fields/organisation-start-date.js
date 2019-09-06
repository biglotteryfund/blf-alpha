'use strict';
const get = require('lodash/fp/get');
const moment = require('moment');

const Joi = require('../../lib/joi-extensions');

const { ORG_MIN_AGE } = require('../constants');

module.exports = function(locale) {
    const localise = get(locale);

    const exampleYear = moment()
        .subtract('5', 'years')
        .format('YYYY');

    return {
        name: 'organisationStartDate',
        type: 'month-year',
        label: localise({
            en: `When was your organisation set up?`,
            cy: `Pryd sefydlwyd eich sefydliad?`
        }),
        explanation: localise({
            en: `<p>Please tell us the month and year.</p>
                 <p><strong>For example: 11 ${exampleYear}</strong></p>`,
            cy: `<p>Dywedwch wrthym y mis a’r flwyddyn.</p>
                 <p><strong>Er enghraifft: 11 ${exampleYear}</strong></p>`
        }),
        isRequired: true,
        schema: Joi.monthYear()
            .pastDate()
            .minTimeAgo(ORG_MIN_AGE.amount, ORG_MIN_AGE.unit)
            .required(),
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
            },
            {
                type: 'number.min',
                key: 'year',
                message: localise({
                    en: `Must be a full year e.g. ${exampleYear}`,
                    cy: `Rhaid bod yn flwyddyn gyfan e.e ${exampleYear}`
                })
            },
            {
                type: 'monthYear.pastDate',
                message: localise({
                    en: 'Date you enter must be in the past',
                    cy: 'Rhaid i’r dyddiad fod yn y gorffennol'
                })
            }
        ]
    };
};
