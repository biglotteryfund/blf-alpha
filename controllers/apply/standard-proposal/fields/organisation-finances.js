'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const { CurrencyField, DayMonthField } = require('../../lib/field-types');
const isNewOrganisation = require('../lib/new-organisation');

module.exports = {
    fieldAccountingYearDate(locale) {
        const localise = get(locale);

        return new DayMonthField({
            locale: locale,
            name: 'accountingYearDate',
            label: localise({
                en: 'What is your accounting year end date?',
                cy: 'Beth yw eich dyddiad gorffen blwyddyn ariannol?',
            }),
            explanation: localise({
                en: `<p>For example: 31 03</p>`,
                cy: '<p>Er enghraifft: 31 03</p>',
            }),
            schema(originalSchema) {
                return originalSchema;
            },
        });
    },
    fieldTotalIncomeYear(locale, data = {}) {
        const localise = get(locale);

        return new CurrencyField({
            locale: locale,
            name: 'totalIncomeYear',
            label: localise({
                en: 'What is your total income for the year?',
                cy: 'Beth yw cyfanswm eich incwm am y flwyddyn?',
            }),
            explanation: localise({
                en:
                    'This should be based on your most recent accounts, or a 12-month projection (if you’ve been up and running for less than 15 months). Use whole numbers only - for example, 12,345 and not 12,345.67.',
                cy: '',
            }),
            isRequired: !isNewOrganisation(get('organisationStartDate')(data)),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: oneLine`Enter a total income for the year
                        (eg. a whole number with no commas or decimal points)`,
                        cy: oneLine`Rhowch gyfanswm incwm am y flwyddyn
                        (e.e. rhif cyflawn heb goma na bwyntiau degol)`,
                    }),
                },
                {
                    type: 'any.invalid',
                    message: localise({
                        en: 'Total income must be a real number',
                        cy: 'Rhaid i’r cyfanswm incwm fod yn rif go iawn',
                    }),
                },
                {
                    type: 'number.integer',
                    message: localise({
                        en: oneLine`Total income must be a whole number
                        (eg. no decimal point)`,
                        cy: oneLine`Rhaid i’r cyfanswm incwm fod yn rif cyflawn
                        (e.e. dim pwynt degol)`,
                    }),
                },
                {
                    type: 'number.max',
                    message: localise({
                        en: oneLine`Total income must be less than ten digits`,
                        cy: ``,
                    }),
                },
            ],
        });
    },
};
