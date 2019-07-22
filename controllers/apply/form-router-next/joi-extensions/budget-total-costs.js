'use strict';
const { get, sumBy, isString } = require('lodash');

// @TODO: Merge this and budget items into a single budget fields
module.exports = function budgetTotalCosts(joi) {
    return {
        name: 'budgetTotalCosts',
        base: joi.number().integer(),
        language: {
            underBudget: 'under project budget total'
        },
        /* eslint-disable-next-line no-unused-vars */
        coerce(value, state, options) {
            if (isString(value)) {
                // Strip out any non-numeric characters (eg. ,) but keep decimal points
                return value.replace(/[^0-9.]/g, '');
            }
            return value;
        },
        /* eslint-disable-next-line no-unused-vars */
        pre(value, state, options) {
            const projectBudget = get(state.parent, 'projectBudget');
            if (projectBudget) {
                const total = sumBy(
                    projectBudget,
                    item => parseInt(item.cost, 10) || 0
                );
                if (value < total) {
                    return this.createError(
                        'budgetTotalCosts.underBudget',
                        { v: value },
                        state,
                        options
                    );
                }
            }
            return value;
        }
    };
};
