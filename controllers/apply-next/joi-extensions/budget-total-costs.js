'use strict';
const { get, sumBy } = require('lodash');

// @TODO: Merge this and budget items into a single budget fields
module.exports = function budgetTotalCosts(joi) {
    return {
        name: 'budgetTotalCosts',
        base: joi.number(),
        language: {
            underBudget: 'under project budget total'
        },
        /* eslint-disable-next-line no-unused-vars */
        pre(value, state, options) {
            const projectBudget = get(state.parent, 'project-budget');
            if (projectBudget) {
                const total = sumBy(projectBudget, item => item.cost);
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
