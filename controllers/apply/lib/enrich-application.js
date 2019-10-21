'use strict';
const get = require('lodash/fp/get');

const awardsForAllFormBuilder = require('../awards-for-all/form');
const getAdviceFormBuilder = require('../get-advice/form');

const { findLocationName } = require('./location-options');
const {
    formatBudget,
    formatCurrency,
    formatDateRange
} = require('./formatters');

function formBuilderFor(formId) {
    return formId === 'standard-enquiry'
        ? getAdviceFormBuilder
        : awardsForAllFormBuilder;
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
            value: findLocationName(data.projectLocation)
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
            value: findLocationName(data.projectLocation)
        },
        {
            label: localise({ en: 'Organisation', cy: '' }),
            value: data.organisationTradingName || data.organisationLegalName
        }
    ];
}

function enrichPending(application, locale) {
    const data = application.applicationData || {};
    const form = formBuilderFor(application.formId)({ locale, data });
    const localise = get(locale);

    function createPending({ projectName, amountRequested, overview, link }) {
        return {
            type: 'pending',
            id: application.id,
            formId: application.formId,
            projectName: projectName,
            amountRequested: amountRequested,
            overview: overview,
            progress: form.progress,
            expiresAt: application.expiresAt,
            updatedAt: application.updatedAt,
            link: link
        };
    }

    if (application.formId === 'standard-enquiry') {
        return createPending({
            projectName:
                data.projectName ||
                localise({ en: 'Untitled proposal', cy: '' }),
            amountRequested: formatCurrency(data.projectCosts || 0),
            overview: standardOverview(data, locale),
            link: {
                url: `/apply/get-advice/edit/${application.id}`,
                label: 'Continue'
            }
        });
    } else {
        return createPending({
            projectName:
                data.projectName ||
                localise({ en: 'Untitled application', cy: 'Cais heb deitl' }),
            amountRequested: formatBudget(locale)(data.projectBudget),
            overview: simpleOverview(data, locale),
            link: {
                url: `/apply/awards-for-all/edit/${application.id}`,
                label: 'Continue'
            }
        });
    }
}

function enrichSubmitted(application, locale) {
    const data = application.salesforceSubmission.application;

    function createSubmitted({ amountRequested, overview }) {
        return {
            type: 'submitted',
            id: application.id,
            formId: application.formId,
            projectName: data.projectName,
            amountRequested: amountRequested,
            overview: overview,
            submittedAt: application.createdAt
        };
    }

    if (application.formId === 'standard-enquiry') {
        return createSubmitted({
            amountRequested: `£${data.projectCosts.toLocaleString()}`,
            overview: standardOverview(data, locale)
        });
    } else {
        return createSubmitted({
            amountRequested: formatBudget(locale)(data.projectBudget),
            overview: simpleOverview(data, locale)
        });
    }
}

module.exports = {
    enrichPending,
    enrichSubmitted
};
