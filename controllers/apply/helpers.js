'use strict';
const { cloneDeep, find, flatMap } = require('lodash');
const { check } = require('express-validator/check');

function flattenFormData(formData) {
    return Object.assign({}, ...flatMap(formData));
}

function stepWithValues(step, values) {
    const clonedStep = cloneDeep(step);
    clonedStep.fieldsets = clonedStep.fieldsets.map(fieldset => {
        fieldset.fields = fieldset.fields.map(field => {
            const match = find(values, (value, name) => {
                return name === field.name;
            });

            if (match) {
                field.value = match;
            }

            return field;
        });
        return fieldset;
    });

    return clonedStep;
}

function stepsWithValues(steps, data) {
    return steps.map((step, idx) => {
        const dataForStep = data[`step-${idx + 1}`];
        return stepWithValues(step, dataForStep);
    });
}


/**
 * Validate email address with translated error message;
 * @param {string} langKey
 * @param {string} fieldName
 */
function validateIsEmail(langKey, fieldName) {
    return check(fieldName)
        .trim()
        .isEmail()
        .withMessage((value, { req }) => {
            const formCopy = req.i18n.__(langKey);
            const errorMessage = formCopy.fields[fieldName].errorMessage;
            return req.i18n.__(errorMessage);
        });
}


module.exports = {
    stepWithValues,
    stepsWithValues,
    flattenFormData,
    validateIsEmail
};
