'use strict';
const { fields } = require('./material-fields');

module.exports = function normaliseUserInput(input) {
    return Object.values(fields).reduce(function(acc, field) {
        const originalValue = input[field.name];
        const otherValue = input[`${field.name}Other`];

        /**
         * Override value if "other" field is entered.
         */
        const fieldValue =
            field.allowOther && otherValue ? otherValue : originalValue;

        if (fieldValue) {
            acc.push({
                key: field.name,
                label: field.emailKey,
                value: fieldValue
            });
        }

        return acc;
    }, []);
};
