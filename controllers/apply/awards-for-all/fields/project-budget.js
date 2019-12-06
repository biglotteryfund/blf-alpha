'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');

const {
    MAX_BUDGET_TOTAL_GBP,
    MIN_BUDGET_TOTAL_GBP,
    FREE_TEXT_MAXLENGTH
} = require('../constants');

module.exports = function(locale) {
    const localise = get(locale);

    const ROW_LIMIT = 10;

    return {
        name: 'projectBudget',
        label: localise({
            en: 'List the costs you would like us to fund',
            cy: 'Rhestrwch y costau hoffech i ni eu hariannu'
        }),
        explanation: localise({
            en: `<p>
                You should use budget headings, rather than a detailed list
                of items. For example, if you're applying for pens, pencils,
                paper and envelopes, using 'office supplies' is fine.
                Please enter whole numbers only.
            </p>
            <p>Please note you can only have a maximum of 10 rows.</p>`,
            cy: `<p>
                Dylech ddefnyddio penawdau llai, yn hytrach na rhestr hir
                o eitemau. Er enghraifft, os ydych yn ymgeisio am feiros,
                pensiliau, papur ac amlenni, byddai defnyddio
                ‘offer swyddfa’ yn iawn. Rhowch y rhifau cyfan yn unig. 
            </p>
            <p>Sylwch mai dim ond uchafswm o 10 rhes gallwch ei gael.</p>`
        }),
        type: 'budget',
        attributes: {
            min: MIN_BUDGET_TOTAL_GBP,
            max: MAX_BUDGET_TOTAL_GBP,
            rowLimit: ROW_LIMIT
        },
        isRequired: true,
        schema: Joi.budgetItems()
            .max(ROW_LIMIT)
            .validBudgetRange(MIN_BUDGET_TOTAL_GBP, MAX_BUDGET_TOTAL_GBP)
            .required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a project budget',
                    cy: 'Rhowch gyllideb prosiect'
                })
            },
            {
                type: 'any.empty',
                key: 'item',
                message: localise({
                    en: 'Enter an item or activity',
                    cy: 'Rhowch eitem neu weithgaredd'
                })
            },
            {
                type: 'string.max',
                key: 'item',
                message: localise({
                    en: oneLine`Item or activity must be
                        ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: oneLine`Rhaid i’r eitem neu weithgaredd fod yn llai na
                        ${FREE_TEXT_MAXLENGTH.large} nod`
                })
            },
            {
                type: 'number.base',
                key: 'cost',
                message: localise({
                    en: 'Enter an amount',
                    cy: 'Rhowch nifer'
                })
            },
            {
                type: 'number.integer',
                key: 'cost',
                message: localise({
                    en: 'Use whole numbers only, eg. 360',
                    cy: 'Defnyddiwch rifau cyflawn yn unig, e.e. 360'
                })
            },
            {
                type: 'array.min',
                message: localise({
                    en: 'Enter at least one item',
                    cy: 'Rhowch o leiaf un eitem'
                })
            },
            {
                type: 'array.max',
                message: localise({
                    en: `Enter no more than ${ROW_LIMIT} items`,
                    cy: `Rhowch dim mwy na ${ROW_LIMIT} eitem`
                })
            },
            {
                type: 'budgetItems.overBudget',
                message: localise({
                    en: oneLine`Costs you would like us to fund must be
                        less than £${MAX_BUDGET_TOTAL_GBP.toLocaleString()}`,
                    cy: oneLine`Rhaid i’r costau hoffech i ni eu hariannu
                        fod yn llai na £${MAX_BUDGET_TOTAL_GBP.toLocaleString()}`
                })
            },
            {
                type: 'budgetItems.underBudget',
                message: localise({
                    en: oneLine`Costs you would like us to fund must be
                        greater than £${MIN_BUDGET_TOTAL_GBP.toLocaleString()}`,
                    cy: oneLine`Rhaid i’r costau hoffech i ni eu hariannu
                        fod yn fwy na £${MIN_BUDGET_TOTAL_GBP.toLocaleString()}`
                })
            }
        ]
    };
};
