'use strict';
const get = require('lodash/fp/get');

const { formatBudget, formatDateRange } = require('./formatters');
const awardsForAllFormBuilder = require('../awards-for-all/form');
const getAdviceFormBuilder = require('../get-advice/form');

function formBuilderFor(formId) {
    return formId === 'standard-enquiry'
        ? getAdviceFormBuilder
        : awardsForAllFormBuilder;
}

function formatCurrency(value) {
    return `£${value.toLocaleString()}`;
}

function formatYears(value, locale) {
    const localise = get(locale);

    return `${value} ${localise({
        en: 'years',
        cy: 'blynedd'
    })}`;
}

function simpleOverview(data, locale) {
    const localise = get(locale);

    return [
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
            label: localise({ en: 'Location', cy: '' }),
            value: data.projectLocation
        },
        {
            label: localise({ en: 'Organisation', cy: 'Sefydliad' }),
            value: data.organisationTradingName || data.organisationLegalName
        }
    ];
}

function standardOverview(data, locale) {
    const localise = get(locale);

    return [
        {
            label: localise({ en: 'Project length', cy: '' }),
            value: data.projectDurationYears
                ? formatYears(data.projectDurationYears, locale)
                : null
        },
        {
            label: localise({ en: 'Location', cy: '' }),
            value: data.projectLocation
        },
        {
            label: localise({ en: 'Organisation', cy: '' }),
            value: data.organisationTradingName || data.organisationLegalName
        }
    ];
}

function enrichPendingApplication(application, locale) {
    const data = application.applicationData || {};
    const form = formBuilderFor(application.formId)({ locale, data });
    const localise = get(locale);

    if (application.formId === 'standard-enquiry') {
        return {
            type: 'pending',
            id: application.id,
            formId: application.formId,
            projectName:
                data.projectName ||
                localise({ en: 'Untitled proposal', cy: '' }),
            amountRequested: formatCurrency(data.projectCosts || 0),
            overview: standardOverview(data, locale),
            progress: form.progress,
            expiresAt: application.expiresAt,
            updatedAt: application.updatedAt,
            link: {
                url: `/apply/get-advice/edit/${application.id}`,
                label: 'Continue'
            }
        };
    } else {
        return {
            type: 'pending',
            id: application.id,
            formId: application.formId,
            projectName:
                data.projectName ||
                localise({ en: 'Untitled application', cy: 'Cais heb deitl' }),
            amountRequested: formatBudget(locale)(data.projectBudget),
            overview: simpleOverview(data, locale),
            progress: form.progress,
            expiresAt: application.expiresAt,
            updatedAt: application.updatedAt,
            link: {
                url: `/apply/awards-for-all/edit/${application.id}`,
                label: 'Continue'
            }
        };
    }
}

function enrichSubmittedApplication(application, locale) {
    const data = application.salesforceSubmission.application;

    if (application.formId === 'standard-enquiry') {
        return {
            type: 'submitted',
            id: application.id,
            formId: application.formId,
            projectName: data.projectName,
            amountRequested: `£${data.projectCosts.toLocaleString()}`,
            overview: standardOverview(data, locale),
            submittedAt: application.createdAt
        };
    } else {
        return {
            type: 'submitted',
            id: application.id,
            formId: application.formId,
            projectName: data.projectName,
            amountRequested: formatBudget(locale)(data.projectBudget),
            overview: simpleOverview(data, locale),
            submittedAt: application.createdAt
        };
    }
}

module.exports = {
    enrichPendingApplication,
    enrichSubmittedApplication
};
