'use strict';
const cloneDeep = require('lodash/cloneDeep');
const find = require('lodash/find');
const flatMap = require('lodash/flatMap');
const flatMapDeep = require('lodash/flatMapDeep');
const get = require('lodash/get');
const includes = require('lodash/includes');
const isEmpty = require('lodash/isEmpty');
const pick = require('lodash/pick');
const reject = require('lodash/reject');

const { formatterFor } = require('./formatters');
const validateForm = require('./validate-form');

/**
 * Calculate form progress
 * Validates the form and returns a status
 * for each section and the form as a whole.
 */
function progressSummary(form, data) {
    const FORM_STATES = {
        empty: 'empty',
        incomplete: 'incomplete',
        complete: 'complete'
    };

    function determineStatus(value, errors = []) {
        if (isEmpty(value)) {
            return FORM_STATES.empty;
        } else if (errors.length > 0) {
            return FORM_STATES.incomplete;
        } else {
            return FORM_STATES.complete;
        }
    }

    const validationResult = validateForm(form, data);

    const errors = get(validationResult, 'error.details', []);

    const allStatus = determineStatus(validationResult.value, errors);

    return {
        isComplete: allStatus === FORM_STATES.complete,
        all: determineStatus(validationResult.value, errors),
        sections: form.sections.map((section, idx) => {
            const fieldNames = flatMapDeep(section.steps, step => {
                return step.fieldsets.map(fieldset =>
                    fieldset.fields.map(field => field.name)
                );
            });

            const dataForSection = pick(validationResult.value, fieldNames);
            const errorsForSection = errors.filter(detail =>
                includes(fieldNames, detail.path[0])
            );

            return {
                slug: section.slug,
                label: `${idx + 1}: ${section.shortTitle || section.title}`,
                status: determineStatus(dataForSection, errorsForSection)
            };
        })
    };
}

/**
 * Enriches a form object
 *
 * @param {Object} baseForm
 * @param {Object} [data]
 */
module.exports = function enrichForm(baseForm, data = {}) {
    const clonedForm = cloneDeep(baseForm);

    const progress = progressSummary(clonedForm, data);

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
        section.progress = progress.sections.find(
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

    clonedForm.progress = progress;

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
