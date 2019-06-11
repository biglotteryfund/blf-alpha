'use strict';
const find = require('lodash/find');
const findIndex = require('lodash/findIndex');
const findLastIndex = require('lodash/findLastIndex');

/**
 * @typedef {object} MatchOptions
 * @property {String} baseUrl
 * @property {Array} sections
 * @property {Number} currentSectionIndex
 * @property {Number} [currentStepIndex]
 */

/**
 * Find next matching URL
 * @param {MatchOptions} options
 */
function findNextMatchingUrl({
    baseUrl,
    sections,
    sectionSlug,
    currentStepIndex = null
}) {
    const currentSection = find(
        sections,
        section => section.slug === sectionSlug
    );

    const currentSectionIndex = findIndex(
        sections,
        section => section.slug === sectionSlug
    );

    const nextSection = sections[currentSectionIndex + 1];

    if (currentStepIndex === null && currentSection.introduction) {
        return `${baseUrl}/${currentSection.slug}/1`;
    } else {
        const targetStepIndex = findIndex(
            currentSection.steps,
            step => step.isRequired === true,
            currentStepIndex + 1
        );

        if (
            targetStepIndex !== -1 &&
            targetStepIndex <= currentSection.steps.length
        ) {
            return `${baseUrl}/${currentSection.slug}/${targetStepIndex + 1}`;
        } else if (nextSection) {
            return `${baseUrl}/${nextSection.slug}`;
        } else {
            return `${baseUrl}/summary`;
        }
    }
}

/**
 * Find previous matching URL
 * @param {MatchOptions} options
 */
function findPreviousMatchingUrl({
    baseUrl,
    sections,
    sectionSlug,
    currentStepIndex = null
}) {
    const currentSection = find(
        sections,
        section => section.slug === sectionSlug
    );

    const currentSectionIndex = findIndex(
        sections,
        section => section.slug === sectionSlug
    );

    const previousSection = sections[currentSectionIndex - 1];

    if (currentStepIndex > 0) {
        const targetStepIndex = findLastIndex(
            currentSection.steps,
            step => step.isRequired === true,
            currentStepIndex - 1
        );
        return `${baseUrl}/${currentSection.slug}/${targetStepIndex + 1}`;
    } else if (currentStepIndex === 0 && currentSection.introduction) {
        return `${baseUrl}/${currentSection.slug}`;
    } else if (previousSection) {
        const targetStepIndex = findLastIndex(
            previousSection.steps,
            step => step.isRequired === true
        );
        return `${baseUrl}/${previousSection.slug}/${targetStepIndex + 1}`;
    } else {
        return baseUrl;
    }
}

/**
 * Find next and previous matching URLs
 * @param {MatchOptions} options
 */
module.exports = function pagination(options) {
    return {
        nextUrl: findNextMatchingUrl(options),
        previousUrl: findPreviousMatchingUrl(options)
    };
};
