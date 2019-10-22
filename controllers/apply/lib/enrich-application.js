'use strict';
const get = require('lodash/fp/get');
const sumBy = require('lodash/sumBy');

const awardsForAllFormBuilder = require('../awards-for-all/form');
const getAdviceFormBuilder = require('../get-advice/form');

const { findLocationName } = require('./location-options');
const { formatCurrency, formatDateRange } = require('./formatters');

function formBuilderFor(formId) {
    return formId === 'standard-enquiry'
        ? getAdviceFormBuilder
        : awardsForAllFormBuilder;
}

function formatBudgetTotal(value) {
    if (value) {
        const total = sumBy(value, item => parseInt(item.cost, 10) || 0);
        return `£${total.toLocaleString()}`;
    }
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

    function createPending(props) {
        return Object.assign(
            {
                type: 'pending',
                id: application.id,
                formId: application.formId,
                expiresAt: application.expiresAt,
                updatedAt: application.updatedAt,
                progress: form.progress
            },
            props
        );
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
            },
            deleteUrl: `/apply/get-advice/delete/${application.id}`
        });
    } else {
        return createPending({
            projectName:
                data.projectName ||
                localise({ en: 'Untitled application', cy: 'Cais heb deitl' }),
            amountRequested: formatBudgetTotal(data.projectBudget),
            overview: simpleOverview(data, locale),
            link: {
                url: `/apply/awards-for-all/edit/${application.id}`,
                label: 'Continue'
            },
            deleteUrl: `/apply/get-advice/delete/${application.id}`
        });
    }
}

function enrichSubmitted(application, locale) {
    const data = application.salesforceSubmission.application;
    const localise = get(locale);

    function createSubmitted(props) {
        return Object.assign(
            {
                type: 'submitted',
                id: application.id,
                formId: application.formId,
                submittedAt: application.createdAt
            },
            props
        );
    }

    if (application.formId === 'standard-enquiry') {
        return createSubmitted({
            projectName:
                data.projectName ||
                localise({ en: 'Untitled proposal', cy: '' }),
            amountRequested: `£${data.projectCosts.toLocaleString()}`,
            overview: standardOverview(data, locale)
        });
    } else {
        return createSubmitted({
            projectName:
                data.projectName ||
                localise({ en: 'Untitled application', cy: 'Cais heb deitl' }),
            amountRequested: formatBudgetTotal(data.projectBudget),
            overview: simpleOverview(data, locale)
        });
    }
}

module.exports = {
    enrichPending,
    enrichSubmitted
};
