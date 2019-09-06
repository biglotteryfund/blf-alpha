'use strict';
const { get } = require('lodash');
const { FREE_TEXT_MAXLENGTH } = require('../../awards-for-all/constants');

const compareNames = nameFieldToCompare => {
    return function(params, value, state, options) {
        // Format names into a comparable string
        const serialize = nameField => nameField.firstName + nameField.lastName;

        const comparisonName = get(state.parent, nameFieldToCompare, []);

        if (serialize(comparisonName) === serialize(value)) {
            return this.createError(
                'name.matchesOther',
                { v: value },
                state,
                options
            );
        } else {
            return value;
        }
    };
};

module.exports = function fullName(joi) {
    return {
        base: joi.object({
            firstName: joi.string().max(FREE_TEXT_MAXLENGTH.small).required(),
            lastName: joi.string().max(FREE_TEXT_MAXLENGTH.medium).required()
        }),
        name: 'fullName',
        rules: [
            {
                // Enforce a unique name compared to the senior contact
                name: 'mainContact',
                validate: compareNames('seniorContactName')
            },
            {
                // Enforce a unique name compared to the main contact
                name: 'seniorContact',
                validate: compareNames('mainContactName')
            }
        ]
    };
};
