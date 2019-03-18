'use strict';
const { get } = require('lodash/fp');
const { cloneDeep, find, findIndex, findLastIndex } = require('lodash');

const displayFormat = require('./lib/display-format');

function filterOptionsBy(data = {}) {
    return function(option) {
        return option.showWhen ? option.showWhen(data || {}) : true;
    };
}

/**
 * Enhances a form object by:
 * - Localising all labels and messages
 * - Assigning values to fields, along with a display value for views
 * - Marking steps as notRequired if matchesCondition is currently false
 *
 * @param {Object} options
 * @param {String} options.locale
 * @param {Object} options.baseForm
 * @param {Object} [options.data]
 */
function enhanceForm({ locale, baseForm, data = {} }) {
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
            field.options = field.options.filter(filterOptionsBy(data)).map(option => {
                option.label = localise(option.label);
                option.explanation = localise(option.explanation);
                return option;
            });
        }

        // Assign value to field if present
        const fieldValue = find(data, (value, name) => name === field.name);
        if (fieldValue) {
            field.value = fieldValue;
            field.displayValue = displayFormat(field, fieldValue);
        }

        return field;
    };

    const enhanceStep = step => {
        step.title = localise(step.title);

        step.fieldsets = step.fieldsets.map(fieldset => {
            fieldset.legend = localise(fieldset.legend);
            fieldset.introduction = localise(fieldset.introduction);
            fieldset.fields = fieldset.fields.map(enhanceField);
            return fieldset;
        });

        // Handle steps that don't need to be completed based on current form data
        if (step.matchesCondition && step.matchesCondition(data) === false) {
            step.notRequired = true;
        }

        return step;
    };

    clonedForm.sections = clonedForm.sections.map(section => {
        section = enhanceSection(section);
        section.steps = section.steps.map(enhanceStep);
        return section;
    });

    clonedForm.newApplicationFields = clonedForm.newApplicationFields.map(enhanceField);

    if (clonedForm.termsFields) {
        clonedForm.termsFields = clonedForm.termsFields.map(enhanceField);
    }

    return clonedForm;
}

/**
 * @typedef {object} MatchOptions
 * @property {String} baseUrl
 * @property {Array} sections
 * @property {Number} currentSectionIndex
 * @property {Number} currentStepIndex
 * @property {Object} formData
 */

/**
 * Find next matching URL
 * @param {MatchOptions} options
 */
function findNextMatchingUrl({ baseUrl, sections, currentSectionIndex, currentStepIndex, formData }) {
    const currentSection = sections[currentSectionIndex];
    const nextSection = sections[currentSectionIndex + 1];

    const targetStepIndex = findIndex(
        currentSection.steps,
        step => (step.matchesCondition ? step.matchesCondition(formData) === true : true),
        currentStepIndex + 1
    );

    if (targetStepIndex !== -1 && targetStepIndex <= currentSection.steps.length) {
        return `${baseUrl}/${currentSection.slug}/${targetStepIndex + 1}`;
    } else if (nextSection) {
        return `${baseUrl}/${nextSection.slug}`;
    } else {
        return `${baseUrl}/summary`;
    }
}

/**
 * Find previous matching URL
 * @param {MatchOptions} options
 */
function findPreviousMatchingUrl({ baseUrl, sections, currentSectionIndex, currentStepIndex, formData }) {
    const currentSection = sections[currentSectionIndex];
    const previousSection = sections[currentSectionIndex - 1];

    if (currentStepIndex !== 0) {
        const targetStepIndex = findLastIndex(
            currentSection.steps,
            step => (step.matchesCondition ? step.matchesCondition(formData) === true : true),
            currentStepIndex - 1
        );
        return `${baseUrl}/${currentSection.slug}/${targetStepIndex + 1}`;
    } else if (previousSection) {
        return `${baseUrl}/${previousSection.slug}/${previousSection.steps.length}`;
    } else {
        return baseUrl;
    }
}

/**
 * Find next and previous matching URLs
 * @param {MatchOptions} options
 */
function nextAndPrevious(options) {
    return {
        nextUrl: findNextMatchingUrl(options),
        previousUrl: findPreviousMatchingUrl(options)
    };
}

module.exports = {
    enhanceForm,
    filterOptionsBy,
    findNextMatchingUrl,
    findPreviousMatchingUrl,
    nextAndPrevious
};
