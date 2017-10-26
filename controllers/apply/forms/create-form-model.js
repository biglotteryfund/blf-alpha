const { find, flatMap, has, get } = require('lodash');

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
 * this funciton then adds some additional computed methods on top.
 * - withValues allows the current form data for a step to be passed in and the values attached to each field
 * - getValidators collects all validators associated with each field for express-valdiator
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
                return field.validator(field);
            });
        }
    });
}

/**
 * This function allows us to model a form using a schema.
 * Main API is to register "steps":
 * - formModel({ id: 'example', title: 'Example' }).registerStep({});
 * Each step equates to a single page in a multi-page form.
 */
function createFormModel({ id, title }) {
    let steps = [];
    let successStep;
    return {
        id: id,
        title: title,
        getSessionProp: function(stepNo) {
            const baseProp = `form.${id}`;
            if (stepNo) {
                return `${baseProp}.step-${stepNo}`;
            }

            return baseProp;
        },
        getSteps: function() {
            return steps;
        },
        getStepsWithValues: function(data) {
            return steps.map((step, idx) => step.withValues(data[`step-${idx + 1}`]));
        },
        getSuccessStep: function() {
            if (!successStep) {
                throw new Error('Must register success step');
            }

            return successStep;
        },
        registerStep: function(step) {
            steps.push(createStep(step));
        },
        registerSuccessStep: function(success) {
            successStep = success;
        }
    };
}

module.exports = createFormModel;
