'use strict';
const concat = require('lodash/concat');
const filter = require('lodash/fp/filter');
const flatMap = require('lodash/flatMap');
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
    const filterKeyAndType = filter(function(message) {
        return (
            message.key === detail.context.key && message.type === detail.type
        );
    });

    const filterTypeOnly = filter(function(message) {
        return !has(message, 'key') && message.type === detail.type;
    });

    const filterBase = filter(function(message) {
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
 */
function normaliseErrors({ validationError, errorMessages }) {
    const errorDetails = getOr([], 'details')(validationError);
    const uniqueErrorsDetails = uniqBy(detail => head(detail.path))(
        errorDetails
    );

    return flatMap(uniqueErrorsDetails, detail => {
        const name = head(detail.path);
        const fieldMessages = getOr([], name)(errorMessages);
        const matchingMessages = messagesForError(fieldMessages, detail);

        return matchingMessages.map(match => {
            return {
                param: name,
                type: match.type,
                msg: match.message
            };
        });
    });
}

/**
 * This is structurally the same as validate-form.js in form-router-next.
 * If we reach a point where we're happy with the abstraction and the use-cases
 * don't diverge we could merge these together.
 * @TODO: Merge with validate-form?
 */
module.exports = function validateSchema({ schema, messages }, data = {}) {
    const { value, error } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });

    const normalisedErrors = normaliseErrors({
        validationError: error,
        errorMessages: messages
    });

    return {
        value: value,
        error: error,
        isValid: error === undefined && normalisedErrors.length === 0,
        messages: normalisedErrors
    };
};
