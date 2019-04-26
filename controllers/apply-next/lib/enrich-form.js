'use strict';
const { cloneDeep, find, flatMap, reject } = require('lodash');
const { formatterFor } = require('./formatters');

/**
 * Enriches a form object
 *
 * @param {Object} baseForm
 * @param {Object} [data]
 */
module.exports = function enrichForm(baseForm, data = {}) {
    const clonedForm = cloneDeep(baseForm);

    const enrichField = field => {
        // Assign value to field if present
        const fieldValue = find(data, (value, name) => name === field.name);
        if (fieldValue) {
            field.value = fieldValue;
            field.displayValue = formatterFor(field)(fieldValue);
        }

        return field;
    };

    clonedForm.sections = clonedForm.sections.map(section => {
        section.steps = section.steps.map(function(step) {
            /**
             * Enrich fieldset and filter out any fieldsets with no fields
             * i.e. to account for cases where a fieldset is conditional
             */
            step.fieldsets = reject(
                step.fieldsets.map(fieldset => {
                    fieldset.fields = fieldset.fields.map(enrichField);
                    return fieldset;
                }),
                fieldset => fieldset.fields.length === 0
            );

            /**
             * Flag optional steps if there are no fields
             * i.e. to account for cases where whole step is conditional
             */
            const stepFields = flatMap(step.fieldsets, 'fields');
            step.isRequired = stepFields.length > 0;

            return step;
        });
        return section;
    });

    if (clonedForm.termsFields) {
        clonedForm.termsFields = clonedForm.termsFields.map(enrichField);
    }

    return clonedForm;
};
