'use strict';
const normaliseErrors = require('./normalise-errors');

/**
 * Validate data against the form schema
 *
 * Validating against the whole form ensures that
 * conditional validations are taken into account
 */
module.exports = function validate({ form, data = {} }) {
    const validationResult = form.schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });

    return {
        value: validationResult.value,
        error: validationResult.error,
        messages: normaliseErrors({
            validationError: validationResult.error,
            errorMessages: form.messages
        })
    };
};
