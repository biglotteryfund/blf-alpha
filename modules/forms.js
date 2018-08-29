'use strict';

const { find, flatMap } = require('lodash');

/**
 * Enum of form submission states
 */
const FORM_STATES = {
    NOT_SUBMITTED: 'NOT_SUBMITTED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SUBMISSION_ERROR: 'SUBMISSION_ERROR',
    SUBMISSION_SUCCESS: 'SUBMISSION_SUCCESS'
};

/**
 * Flatten form data object down into a single level of keys/values
 */
function flattenFormData(formData) {
    return Object.assign({}, ...flatMap(formData));
}

/**
 * Take a form field model and form submission data
 * and add the submitted value to the field model.
 * Used to restore state of a field.
 */
function withFieldValue(field, data) {
    if (data) {
        field.value = find(data, (val, key) => key === field.name);
    }

    return field;
}

/**
 * Take a field and the array of errors from express-validator and
 * return the errors that match the provided field
 * Used to render inline errors next to a given field
 */
function errorsForField(field, errors) {
    return errors && errors.filter(error => error.param === field.name);
}

module.exports = {
    FORM_STATES,
    flattenFormData,
    withFieldValue,
    errorsForField
};
