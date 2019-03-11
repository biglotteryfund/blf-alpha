'use strict';
const { includes } = require('lodash');
const { getOr, uniqBy } = require('lodash/fp');

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
        fieldNames.length > 0 ? errors.filter(detail => includes(fieldNames, detail.path[0])) : errors;

    const uniqueFilteredErrors = uniqBy(detail => detail.path[0])(filteredErrors);

    return uniqueFilteredErrors.map(detail => {
        const name = detail.path[0];
        const fieldMessages = errorMessages[name];
        const fieldMessage = fieldMessages[detail.type] || fieldMessages['base'];
        return { param: name, msg: fieldMessage[locale] };
    });
}

module.exports = {
    normaliseErrors
};
