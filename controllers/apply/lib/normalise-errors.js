'use strict';
const concat = require('lodash/concat');
const filter = require('lodash/fp/filter');
const flatMap = require('lodash/flatMap');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const has = require('lodash/has');
const head = require('lodash/head');
const uniqBy = require('lodash/fp/uniqBy');

/**
 * Messages for error
 * 1. Find messages which either have a key **and** type or **only** a type
 *    Allows us to scope errors messages to specific keys in groups of fields
 * 2. If no matching messages are found then look for a type of 'base'
 *    Allows us to show a generic message for any unmatched error type e.g. "Please enter your name"
 */
function messagesForError(messages, detail) {
    const filterKeyAndType = filter(function (message) {
        return (
            message.key === detail.context.key && message.type === detail.type
        );
    });

    const filterTypeOnly = filter(function (message) {
        return !has(message, 'key') && message.type === detail.type;
    });

    const filterBase = filter(function (message) {
        return !has(message, 'key') && message.type === 'base';
    });

    const matches = concat(
        filterKeyAndType(messages),
        filterTypeOnly(messages)
    );

    return matches.length ? matches : filterBase(messages);
}

/**
 * Normalise errors for use in views
 * - Maps raw joi error objects to a simplified format and
 * - In order to avoid showing multiple validation errors per field we find the first error per field name
 * - Determines the appropriate translated error message to use based on current error type.
 *
 * @param {Object} options
 * @param {Object} options.validationError
 * @param {Object} options.errorMessages
 * @return {Array}
 */
module.exports = function normaliseErrors({
    validationError,
    errorMessages,
    formFields,
}) {
    const errorDetails = getOr([], 'details')(validationError);
    const uniqueErrorsDetails = uniqBy((detail) => head(detail.path))(
        errorDetails
    );

    return flatMap(uniqueErrorsDetails, (detail) => {
        const name = head(detail.path);
        const fieldMessages = getOr([], name)(errorMessages);
        const matchingMessages = messagesForError(fieldMessages, detail);
        const fieldLabel = get(`${name}.label`)(formFields);

        return matchingMessages.map((match) => {
            return {
                param: name,
                msg: match.message,
                label: fieldLabel,
                type: match.type,
                joiType: detail.type,
            };
        });
    });
};
