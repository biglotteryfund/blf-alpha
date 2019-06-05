'use strict';
const flatMap = require('lodash/flatMap');
const get = require('lodash/get');
const isEmpty = require('lodash/isEmpty');
const pick = require('lodash/pick');

const validateForm = require('./validate-form');

const FORM_STATES = {
    empty: 'empty',
    incomplete: 'incomplete',
    complete: 'complete'
};

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
 */
module.exports = function progress(form, data) {
    const validationResult = validateForm(form, data);
    const errors = get(validationResult, 'error.details', []);

    const allStatus = determineStatus(validationResult.value, errors);

    function statusFor(section) {
        const fieldsets = flatMap(section.steps, 'fieldsets');
        const fields = flatMap(fieldsets, 'fields');
        const fieldNames = fields.map(f => f.name);

        return determineStatus(
            pick(validationResult.value, fieldNames),
            errors.filter(detail => fieldNames.includes(detail.path[0]))
        );
    }

    return {
        isComplete: allStatus === FORM_STATES.complete,
        all: allStatus,
        sections: form.sections.map(function(section) {
            return {
                slug: section.slug,
                label: section.shortTitle || section.title,
                status: statusFor(section)
            };
        })
    };
};
