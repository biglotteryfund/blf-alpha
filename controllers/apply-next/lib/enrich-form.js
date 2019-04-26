'use strict';
const { get } = require('lodash/fp');
const { cloneDeep, find, flatMap, isFunction, reject } = require('lodash');

const { formatterFor } = require('./formatters');

/**
 * Enriches a form object
 *
 * @param {Object} options
 * @param {String} options.locale
 * @param {Object} options.baseForm
 * @param {Object} [options.data]
 */
module.exports = function enrichForm({ locale, baseForm, data = {} }) {
    const clonedForm = cloneDeep(baseForm);

    const enrichField = field => {
        const localise = get(locale);
        field.label = localise(field.label);
        field.explanation = localise(field.explanation);

        if (field.options) {
            field.options = field.options.map(option => {
                option.label = localise(option.label);
                option.explanation = localise(option.explanation);
                return option;
            });
        }

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
             * Enhrich fieldset and filter out any fieldsets with no fields
             * i.e. to account for cases where a fieldset is conditional
             */
            const stepFieldsets = step.fieldsets.map(fieldset => {
                fieldset.fields = reject(
                    fieldset.fields,
                    field => field.shouldShow && field.shouldShow(data || {}) === false
                ).map(enrichField);
                return fieldset;
            });
            step.fieldsets = reject(stepFieldsets, fieldset => fieldset.fields.length === 0);

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
