'use strict';
const cloneDeep = require('lodash/cloneDeep');
const find = require('lodash/find');
const flatMap = require('lodash/flatMap');
const reject = require('lodash/reject');

const { formatterFor } = require('./formatters');
const progress = require('./progress');

/**
 * Enriches a form object
 *
 * @param {Object} baseForm
 * @param {Object} [data]
 */
module.exports = function enrichForm(baseForm, data = {}) {
    const clonedForm = cloneDeep(baseForm);

    const progressSummary = progress(clonedForm, data);

    function enrichField(field) {
        // Assign value to field if present
        const fieldValue = find(data, (value, name) => name === field.name);
        if (fieldValue) {
            field.value = fieldValue;
            field.displayValue = formatterFor(field)(fieldValue);
        }

        return field;
    }

    function enrichStep(section, step, stepIndex) {
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

        step.slug = `${section.slug}/${stepIndex + 1}`;

        return step;
    }

    clonedForm.sections = clonedForm.sections.map(section => {
        section.progress = progressSummary.sections.find(
            progressSection => progressSection.slug === section.slug
        );

        section.steps = section.steps.map(function(step, stepIndex) {
            return enrichStep(section, step, stepIndex);
        });

        return section;
    });

    if (clonedForm.termsFields) {
        clonedForm.termsFields = clonedForm.termsFields.map(enrichField);
    }

    clonedForm.progress = progressSummary;

    clonedForm.fullSummary = function() {
        const steps = flatMap(clonedForm.sections, 'steps');
        const fieldsets = flatMap(steps, 'fieldsets');
        const fields = flatMap(fieldsets, 'fields');
        return fields
            .filter(field => field.displayValue)
            .map(field => {
                return {
                    label: field.label,
                    value: field.displayValue
                };
            });
    };

    return clonedForm;
};
