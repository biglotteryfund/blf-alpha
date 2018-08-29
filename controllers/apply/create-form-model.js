'use strict';
const { cloneDeep, find, flatMap, sortBy, groupBy } = require('lodash');

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
 * This function allows us to model a form using a schema.
 * Main API is to register "steps":
 * - formModel({ id: 'example', title: 'Example', shortCode: 'FOO' }).registerStep({});
 * Each step equates to a single page in a multi-page form.
 */
function createFormModel({ id, title, shortCode, steps, startPage }) {
    let reviewStep;
    let successStep;
    let errorStep;

    return {
        id: id,
        title: title,
        shortCode: shortCode,
        steps: steps,
        startPage: startPage,
        registerReviewStep: function(config) {
            reviewStep = config;
        },
        getReviewStep: function() {
            if (!reviewStep) {
                throw new Error('Must register review step');
            }

            return reviewStep;
        },
        registerSuccessStep: function(config) {
            if (!config.processor) {
                throw new Error(
                    'The success processor is required and must be a function which returns a Promise instance'
                );
            }

            successStep = config;
        },
        getSuccessStep: function() {
            if (!successStep) {
                throw new Error('Must register success step');
            }

            return successStep;
        },
        registerErrorStep: function(stepConfig) {
            errorStep = stepConfig;
        },
        getErrorStep: function() {
            if (!errorStep) {
                throw new Error('Must register error step');
            }

            return errorStep;
        }
    };
}

module.exports = {
    createFormModel,
    stepWithValues,
    stepsWithValues,
    flattenFormData
};
