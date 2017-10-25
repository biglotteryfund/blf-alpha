const { find, flatMap, has, get } = require('lodash');

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

function createFormModel({ id, title }) {
    let steps = [];
    let successStep;
    return {
        id: id,
        title: title,
        getSteps: function() {
            return steps;
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
