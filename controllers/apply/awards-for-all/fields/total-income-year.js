'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const CurrencyField = require('../../lib/field-types/currency');

module.exports = function(locale) {
    const localise = get(locale);

    return new CurrencyField({
        locale: locale,
        name: 'totalIncomeYear',
        label: localise({
            en: 'What is your total income for the year?',
            cy: 'Beth yw cyfanswm eich incwm am y flwyddyn?'
        }),
        explanation: localise({
            en: 'Use whole numbers only, eg. 12000',
            cy: 'Defnyddiwch rifau cyflawn yn unig, e.e. 12000'
        }),
        schema: Joi.when(Joi.ref('organisationStartDate.isBeforeMin'), {
            is: true,
            then: Joi.friendlyNumber()
                .integer()
                .required(),
            otherwise: Joi.any().strip()
        }),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: oneLine`Enter a total income for the year
                        (eg. a whole number with no commas or decimal points)`,
                    cy: oneLine`Rhowch gyfanswm incwm am y flwyddyn
                        (e.e. rhif cyflawn heb goma na bwyntiau degol)`
                })
            },
            {
                type: 'any.invalid',
                message: localise({
                    en: 'Total income must be a real number',
                    cy: 'Rhaid i’r cyfanswm incwm fod yn rif go iawn'
                })
            },
            {
                type: 'number.integer',
                message: localise({
                    en: oneLine`Total income must be a whole number
                        (eg. no decimal point)`,
                    cy: oneLine`Rhaid i’r cyfanswm incwm fod yn rif cyflawn
                        (e.e. dim pwynt degol)`
                })
            }
        ]
    });
};
