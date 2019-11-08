'use strict';
const { fields } = require('./material-fields');

module.exports = function normaliseUserInput(input) {
    return Object.values(fields).reduce(function(acc, field) {
        const original = input[field.name];
        const other = input[`${field.name}Other`];
        const fieldValue = field.allowOther && other ? other : original;

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
