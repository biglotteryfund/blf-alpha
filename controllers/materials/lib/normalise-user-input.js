'use strict';
const reduce = require('lodash/reduce');

const materialFields = require('./material-fields');

module.exports = function normaliseUserInput(userInput) {
    return reduce(
        materialFields,
        (acc, field) => {
            let fieldLabel = field.emailKey;
            const originalFieldValue = userInput[field.name];
            const otherValue = userInput[field.name + 'Other'];

            // Override value if "other" field is entered.
            const fieldValue =
                field.allowOther && otherValue
                    ? otherValue
                    : originalFieldValue;

            if (fieldValue) {
                acc.push({
                    key: field.name,
                    label: fieldLabel,
                    value: fieldValue
                });
            }

            return acc;
        },
        []
    );
};
