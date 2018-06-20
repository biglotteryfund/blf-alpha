'use strict';
const { find, flatMap, has, get, sortBy, groupBy } = require('lodash');
const { check } = require('express-validator/check');

/**
 * For a given field attach some additional computed properties
 * - isConditionalOr flags if this field is a conditional field, i.e. has a dependency on another field (child field).
 * - isConditionalFor flags if a field could trigger any conditional fields (parent field).
 * - conditionalFor attaches information about any conditional fields associated with a parent field (names of the conditional fields and the value to check for)
 */
function enhanceField(field, associatedConditionalFields) {
    const conditionalFor = associatedConditionalFields.map(_ => {
        return {
            triggerField: _.name,
            triggerOnValue: _.conditionalOn.value
        };
    });

    return Object.assign(field, {
        isConditionalOn: has(field, 'conditionalOn'),
        isConditionalFor: conditionalFor.length > 0,
        conditionalFor: conditionalFor
    });
}

function getFieldsForFieldsets(fieldsets) {
    return function() {
        const allFields = flatMap(fieldsets, fieldset => fieldset.fields);
        const conditionalFields = allFields.filter(field => has(field, 'conditionalOn'));
        const enhancedFields = allFields.map(field => {
            const associatedConditionalFields = conditionalFields.filter(_ => {
                const conditionalOn = get(_, 'conditionalOn', {});
                return field.name === conditionalOn.name;
            });

            const enhancedField = enhanceField(field, associatedConditionalFields);
            return enhancedField;
        });

        return enhancedFields;
    };
}

/**
 * Create a step based on a schema.
 * Allows us to pass a relatively consise schema for the step,
 * this function then adds some additional computed methods on top.
 * - withValues allows the current form data for a step to be passed in and the values attached to each field
 * - getValidators collects all validators associated with each field for express-validator
 */
function createStep(step) {
    const getFields = getFieldsForFieldsets(step.fieldsets);
    return Object.assign(step, {
        getFields: getFields,
        withValues: function(values) {
            getFields().map(field => {
                field.value = find(values, (value, name) => {
                    return name === field.name;
                });

                return field;
            });
            return step;
        },
        getValidators: function() {
            return getFields().map(field => {
                if (field.validator) {
                    return field.validator(field);
                } else if (field.isRequired === true) {
                    return check(field.name)
                        .trim()
                        .not()
                        .isEmpty()
                        .withMessage(field.errorMessage || `“${field.label}” must be provided`);
                } else {
                    return check(field.name)
                        .trim()
                        .optional();
                }
            });
        }
    });
}

/**
 * This function allows us to model a form using a schema.
 * Main API is to register "steps":
 * - formModel({ id: 'example', title: 'Example', shortCode: 'FOO' }).registerStep({});
 * Each step equates to a single page in a multi-page form.
 */
function createFormModel({ id, title, shortCode }) {
    let steps = [];
    let reviewStep;
    let successStep;
    let errorStep;
    let startPage;

    return {
        id: id,
        title: title,
        shortCode: shortCode,
        getSessionProp: function(stepNo) {
            const baseProp = `form.${id}`;
            if (stepNo) {
                return `${baseProp}.step-${stepNo}`;
            }

            return baseProp;
        },
        registerStep: function(step) {
            steps.push(createStep(step));
        },
        getSteps: function() {
            return steps;
        },
        getStepsWithValues: function(data) {
            return steps.map((step, idx) => step.withValues(data[`step-${idx + 1}`]));
        },
        getStepValuesFlattened: function(data) {
            let obj = {};
            for (let d in data) {
                for (let key in data[d]) {
                    obj[key] = data[d][key];
                }
            }
            return obj;
        },
        orderStepsForInternalUse: function(stepData) {
            // rank steps by their internal order (if provided), falling back to original (source) order
            const stepGroups = groupBy(stepData, s => (s.internalOrder ? 'ordered' : 'unordered'));
            return sortBy(stepGroups.ordered, 'internalOrder').concat(stepGroups.unordered);
        },
        registerStartPage: function(config) {
            startPage = config;
        },
        getStartPage: function() {
            if (!startPage) {
                throw new Error('Must register start page');
            }

            return startPage;
        },
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
    createStep
};
