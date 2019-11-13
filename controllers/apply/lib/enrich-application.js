'use strict';
const get = require('lodash/fp/get');
const sumBy = require('lodash/sumBy');
const toInteger = require('lodash/toInteger');

const awardsForAllFormBuilder = require('../awards-for-all/form');
const standardProposalFormBuilder = require('../standard-proposal/form');

const { findLocationName } = require('./location-options');
const { formatCurrency, formatDateRange } = require('./formatters');

function formatBudgetTotal(value) {
    const total = value ? sumBy(value, item => toInteger(item.cost) || 0) : 0;
    return `£${total.toLocaleString()}`;
}

function formatYears(value, locale) {
    const localise = get(locale);

    return `${value} ${localise({
        en: 'years',
        cy: 'blynedd'
    })}`;
}

function simpleDetails(application, data, locale) {
    const localise = get(locale);

    return {
        projectName: data.projectName,
        untitledName: localise({
            en: `Untitled application`,
            cy: `Cais heb deitl`
        }),
        amountRequested: formatBudgetTotal(data.projectBudget),
        overview: [
            {
                label: localise({
                    en: 'Project dates',
                    cy: 'Dyddiadau’r prosiect'
                }),
                value: data.projectDateRange
                    ? formatDateRange(locale)(data.projectDateRange)
                    : null
            },
            {
                label: localise({ en: 'Location', cy: 'Lleoliad' }),
                value: findLocationName(data.projectLocation)
            },
            {
                label: localise({ en: 'Organisation', cy: 'Mudiad' }),
                value:
                    data.organisationTradingName || data.organisationLegalName
            }
        ]
    };
}

function standardDetails(application, data, locale) {
    const localise = get(locale);

    return {
        projectName: data.projectName,
        untitledName: localise({
            en: `Untitled proposal`,
            cy: `Cynnig heb deitl`
        }),
        amountRequested: formatCurrency(data.projectCosts || 0),
        overview: [
            {
                label: localise({ en: 'Project length', cy: 'Hyd y prosiect' }),
                value: data.projectDurationYears
                    ? formatYears(data.projectDurationYears, locale)
                    : null
            },
            {
                label: localise({ en: 'Location', cy: 'Lleoliad' }),
                value: findLocationName(data.projectLocation)
            },
            {
                label: localise({ en: 'Organisation', cy: 'Mudiad' }),
                value:
                    data.organisationTradingName || data.organisationLegalName
            }
        ]
    };
}

function formBuilderFor(formId) {
    return formId === 'standard-enquiry'
        ? standardProposalFormBuilder
        : awardsForAllFormBuilder;
}

function detailsFor(formId) {
    return formId === 'standard-enquiry' ? standardDetails : simpleDetails;
}

function enrichPending(application, locale) {
    const data = application.applicationData || {};
    const formBuilder = formBuilderFor(application.formId);
    const form = formBuilder({ locale, data });

    const urlSlug =
        application.formId === 'standard-enquiry'
            ? 'your-funding-proposal'
            : 'awards-for-all';

    const defaults = {
        type: 'pending',
        id: application.id,
        formId: application.formId,
        createdAt: application.createdAt,
        expiresAt: application.expiresAt,
        updatedAt: application.updatedAt,
        progress: form.progress,
        editUrl: `/apply/${urlSlug}/edit/${application.id}`,
        deleteUrl: `/apply/${urlSlug}/delete/${application.id}`
    };

    return Object.assign(
        defaults,
        detailsFor(application.formId)(application, data, locale)
    );
}

function enrichSubmitted(application, locale) {
    const data = application.salesforceSubmission.application;

    const defaults = {
        type: 'submitted',
        id: application.id,
        formId: application.formId,
        submittedAt: application.createdAt
    };

    return Object.assign(
        defaults,
        detailsFor(application.formId)(application, data, locale)
    );
}

module.exports = {
    enrichPending,
    enrichSubmitted
};
