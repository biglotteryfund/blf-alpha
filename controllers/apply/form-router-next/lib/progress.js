'use strict';
const { flatMapDeep, get, includes, isEmpty, pick } = require('lodash');
const validateForm = require('./validate-form');

const FORM_STATES = {
    empty: 'empty',
    invalid: 'invalid',
    complete: 'complete'
};

/**
 * Determine status from data and validation errors
 * @param {Object} data
 * @param {Array} errors
 */
function determineStatus(data, errors = []) {
    if (isEmpty(data)) {
        return FORM_STATES.empty;
    } else if (errors.length > 0) {
        return FORM_STATES.incomplete;
    } else {
        return FORM_STATES.complete;
    }
}

/**
 * Calculate form progress
 * Validates the form and returns a status
 * for each section and the form as a whole.
 *
 * @param {Object} form
 * @param {Object} data
 */
module.exports = function progress(form, data) {
    const validationResult = validateForm(form, data);

    const errors = get(validationResult, 'error.details', []);
    const allStatus = determineStatus(validationResult.value, errors);

    return {
        isComplete: allStatus === FORM_STATES.complete,
        all: determineStatus(validationResult.value, errors),
        sections: form.sections.reduce((obj, section) => {
            const fieldNames = flatMapDeep(section.steps, step => {
                return step.fieldsets.map(fieldset =>
                    fieldset.fields.map(field => field.name)
                );
            });

            const dataForSection = pick(validationResult.value, fieldNames);
            const errorsForSection = errors.filter(detail =>
                includes(fieldNames, detail.path[0])
            );

            obj[section.slug] = determineStatus(
                dataForSection,
                errorsForSection
            );

            return obj;
        }, {})
    };
};
