'use strict';
const { cloneDeep, find, flatMap } = require('lodash');

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

module.exports = {
    stepWithValues,
    stepsWithValues,
    flattenFormData
};
