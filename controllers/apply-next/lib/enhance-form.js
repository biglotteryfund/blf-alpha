'use strict';
const { get } = require('lodash/fp');
const { cloneDeep, find, flatMap, isFunction, reject } = require('lodash');

const { formatterFor } = require('./formatters');

/**
 * Enhances a form object by:
 * - Localising all labels and messages
 * - Assigning values to fields, along with a display value for views
 *
 * @param {Object} options
 * @param {String} options.locale
 * @param {Object} options.baseForm
 * @param {Object} [options.data]
 */
module.exports = function enhanceForm({ locale, baseForm, data = {} }) {
    const localise = get(locale);
    const clonedForm = cloneDeep(baseForm);

    clonedForm.title = localise(baseForm.title);

    const enhanceSection = section => {
        section.title = localise(section.title);
        if (section.introduction) {
            section.introduction = localise(section.introduction);
        }
        return section;
    };

    const enhanceField = field => {
        field.label = localise(field.label);
        field.explanation = localise(field.explanation);

        if (field.options) {
            const options = isFunction(field.options) ? field.options(data || {}) : field.options;
            field.options = options.map(option => {
                option.label = localise(option.label);
                option.explanation = localise(option.explanation);
                return option;
            });
        }

        if (isFunction(field.isRequired)) {
            field.isRequired = field.isRequired(data || {});
        }

        // Assign value to field if present
        const fieldValue = find(data, (value, name) => name === field.name);
        if (fieldValue) {
            field.value = fieldValue;
            field.displayValue = formatterFor(field)(fieldValue);
        }

        return field;
    };

    const enhanceFieldset = fieldset => {
        fieldset.legend = localise(fieldset.legend);
        fieldset.introduction = localise(fieldset.introduction);
        fieldset.fields = reject(
            fieldset.fields,
            field => field.shouldShow && field.shouldShow(data || {}) === false
        ).map(enhanceField);
        return fieldset;
    };

    const enhanceStep = step => {
        step.title = localise(step.title);

        /**
         * Enhance fieldset and filter out any fieldsets with no fields
         * i.e. to account for cases where a fieldset is conditional
         */
        const stepFieldsets = step.fieldsets.map(enhanceFieldset);
        step.fieldsets = reject(stepFieldsets, fieldset => fieldset.fields.length === 0);

        /**
         * Flag optional steps if there are no fields
         * i.e. to account for cases where whole step is conditional
         */
        const stepFields = flatMap(step.fieldsets, 'fields');
        step.isRequired = stepFields.length > 0;

        return step;
    };

    clonedForm.sections = clonedForm.sections.map(section => {
        section = enhanceSection(section);
        section.steps = section.steps.map(enhanceStep);
        return section;
    });

    if (clonedForm.termsFields) {
        clonedForm.termsFields = clonedForm.termsFields.map(enhanceField);
    }

    return clonedForm;
};
