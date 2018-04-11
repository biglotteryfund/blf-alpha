'use strict';

const { find } = require('lodash');

/**
 * Enum of form submission states
 */
const FORM_STATES = {
    NOT_SUBMITTED: 'NOT_SUBMITTED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SUBMISSION_ERROR: 'SUBMISSION_ERROR',
    SUBMISSION_SUCCCESS: 'SUBMISSION_SUCCCESS'
};

/**
 * Take a form field model and form submission data
 * and add the submitted value to the field model.
 * Used to restore state of a field.
 */
function withFieldValue(field, data) {
    if (data) {
        const match = find(data, (val, key) => key === field.name);
        field.value = match;
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
    withFieldValue,
    errorsForField
};
