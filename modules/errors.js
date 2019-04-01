'use strict';
const { concat, has, head, flatMap, includes } = require('lodash');
const { filter, get, getOr, uniqBy } = require('lodash/fp');

/**
 * Normalise errors for use in views
 * - Maps raw joi error objects to a simplified format and
 * - In order to avoid showing multiple validation errors per field we find the first error per field name
 * - Determines the appropriate translated error message to use based on current error type.
 *
 * @param {Object} options
 * @param {Object} options.validationError
 * @param {Object} options.errorMessages
 * @param {String} options.locale
 * @param {Array<String>} [options.fieldNames]
 */
function normaliseErrors({ validationError, errorMessages, locale, fieldNames = [] }) {
    const errors = getOr([], 'details')(validationError);

    const filteredErrors =
        fieldNames.length > 0 ? errors.filter(detail => includes(fieldNames, head(detail.path))) : errors;

    const uniqueFilteredErrors = uniqBy(detail => head(detail.path))(filteredErrors);

    /**
     * Find suitable errors
     * 1. Find messages which either have a key **and** type or **only** a type
     *    Allows us to scope errors messages to specific keys in groups of fields (e.g. addresses, dates of birth)
     * 2. If no matching messages are found then look for a type of 'base'
     *    Allows us to show a generic message for any unmatched error type e.g. "Please enter your name"
     */
    const suitableErrors = flatMap(uniqueFilteredErrors, detail => {
        const name = head(detail.path);

        const fieldMessages = errorMessages[name];

        const filterKeyAndType = filter(message => message.key === detail.context.key && message.type === detail.type);
        const filterTypeOnly = filter(message => !has(message, 'key') && message.type === detail.type);
        const filterBase = filter(message => !has(message, 'key') && message.type === 'base');

        const matches = concat(filterKeyAndType(fieldMessages), filterTypeOnly(fieldMessages));

        const matchesWithFallback = matches.length ? matches : filterBase(fieldMessages);

        return matchesWithFallback.map(match => {
            return {
                param: name,
                msg: get(`message.${locale}`)(match)
            };
        });
    });

    return suitableErrors;
}

module.exports = {
    normaliseErrors
};
