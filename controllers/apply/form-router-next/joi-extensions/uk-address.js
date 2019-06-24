'use strict';
const { get } = require('lodash');

const compareAddresses = addressFieldToCompare => {
    return function(params, value, state, options) {
        // Format addresses into a comparable string,
        // making sure we sort them as the stored version
        // is in a different order to the form-submitted one.
        const serialize = address =>
            Object.values(address)
                .sort()
                .join(',');

        const comparisonAddress = get(state.parent, addressFieldToCompare, []);

        if (serialize(comparisonAddress) === serialize(value)) {
            return this.createError(
                'address.matchesOther',
                { v: value },
                state,
                options
            );
        } else {
            return value;
        }
    };
};

module.exports = function ukAddress(joi) {
    return {
        base: joi.object({
            line1: joi.string().required(),
            line2: joi
                .string()
                .allow('')
                .optional(),
            townCity: joi.string().required(),
            county: joi
                .string()
                .allow('')
                .optional(),
            postcode: joi
                .string()
                .postcode()
                .required()
        }),
        name: 'ukAddress',
        rules: [
            {
                // Enforce a unique address compared to the senior contact
                name: 'mainContact',
                validate: compareAddresses('seniorContactAddress')
            },
            {
                // Enforce a unique address compared to the main contact
                name: 'seniorContact',
                validate: compareAddresses('mainContactAddress')
            }
        ]
    };
};
