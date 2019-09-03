'use strict';
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const sumBy = require('lodash/sumBy');

const { oneLine } = require('common-tags');

const Joi = require('../../form-router-next/joi-extensions');

module.exports = function fieldProjectTotalCosts(locale, data) {
    const localise = get(locale);

    const budgetTotal = sumBy(
        getOr([], 'projectBudget')(data),
        item => parseInt(item.cost, 10) || 0
    );

    return {
        name: 'projectTotalCosts',
        label: localise({
            en: 'Tell us the total cost of your project',
            cy: 'Dywedwch wrthym gyfanswm cost eich prosiect'
        }),
        explanation: localise({
            en: `<p>
                    This is the cost of everything related to your project,
                    even things you aren't asking us to fund.
                </p>
                <p>
                    For example, if you are asking us for £8,000 and you are
                    getting £10,000 from another funder to cover additional costs,
                    then your total project cost is £18,000. If you are asking
                    us for £8,000 and there are no other costs then your total
                    project cost is £8,000.
                </p>`,
            cy: `<p>
                    Dyma’r gost o bopeth sy’n gysylltiedig â’ch prosiect,
                    hyd yn oed pethau nad ydych yn gofyn inni ei ariannu.
                </p> 
                <p>
                    Er enghraifft, os ydych yn gofyn i ni am £8,000 a’ch bod yn
                    cael £10,000 gan arianwr gwahanol i ariannu costau ychwanegol,
                    yna cyfanswm cost eich prosiect yw £18,000. Os ydych yn gofyn
                    i ni am £8,000 a bod dim costau ychwanegol, cyfanswm cost
                    eich prosiect yw £8,000.
                </p>`
        }),
        type: 'currency',
        isRequired: true,
        schema: Joi.friendlyNumber()
            .integer()
            .required()
            .min(budgetTotal)
            .required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a total cost for your project',
                    cy: 'Rhowch gyfanswm cost eich prosiect'
                })
            },
            {
                type: 'number.integer',
                message: localise({
                    en: `Total cost must be a whole number (eg. no decimal point)`,
                    cy: `Rhaid i’r cost fod yn rif cyflawn (e.e. dim pwynt degol)`
                })
            },
            {
                type: 'number.min',
                message: localise({
                    en: oneLine`Total cost must be the same as or higher
                        than the amount you’re asking us to fund`,
                    cy: oneLine`Rhaid i’r cyfanswm cost fod yr un peth,
                        neu’n fwy na faint rydych yn ei ofyn amdano. `
                })
            }
        ]
    };
};
