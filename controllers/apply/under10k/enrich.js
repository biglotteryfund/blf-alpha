'use strict';
const get = require('lodash/fp/get');
const sumBy = require('lodash/sumBy');
const toInteger = require('lodash/toInteger');

const { formatDateRange } = require('../lib/formatters');
const { findLocationName } = require('./lib/location-options');

const formBuilder = require('./form');
const { transform } = require('./transforms');

function details(application, data, locale) {
    const localise = get(locale);

    function formatBudgetTotal(value) {
        const total = value
            ? sumBy(value, (item) => toInteger(item.cost) || 0)
            : 0;
        return `£${total.toLocaleString()}`;
    }

    function formatProjectDates() {
        return data.projectStartDate && data.projectEndDate
            ? formatDateRange(locale)({
                  startDate: data.projectStartDate,
                  endDate: data.projectEndDate,
              })
            : null;
    }

    return {
        projectName: data.projectName,
        untitledName: localise({
            en: `Untitled application`,
            cy: `Cais heb deitl`,
        }),
        amountRequested: formatBudgetTotal(data.projectBudget),
        overview: [
            {
                label: localise({
                    en: 'Project dates',
                    cy: 'Dyddiadau’r prosiect',
                }),
                value: formatProjectDates(),
            },
            {
                label: localise({ en: 'Location', cy: 'Lleoliad' }),
                value: findLocationName(data.projectLocation),
            },
            {
                label: localise({ en: 'Organisation', cy: 'Mudiad' }),
                value: data.organisationTradingName
                    ? data.organisationTradingName
                    : data.organisationLegalName,
            },
        ],
    };
}

function enrichPending(application, locale = 'en') {
    const originalData = application.applicationData || {};
    const data = transform(originalData);

    const form = formBuilder({ locale, data });

    const defaults = {
        type: 'pending',
        id: application.id,
        formId: application.formId,
        createdAt: application.createdAt,
        expiresAt: application.expiresAt,
        isExpired: application.isExpired,
        updatedAt: application.updatedAt,
        progress: form.progress,
        editUrl: `/apply/under-10k/edit/${application.id}`,
        deleteUrl: `/apply/under-10k/delete/${application.id}`,
    };

    return Object.assign(defaults, details(application, data, locale));
}

function enrichSubmitted(application, locale = 'en') {
    const data = application.salesforceSubmission.application;

    const defaults = {
        type: 'submitted',
        id: application.id,
        formId: application.formId,
        submittedAt: application.createdAt,
    };

    return Object.assign(defaults, details(application, data, locale));
}

module.exports = {
    enrichPending,
    enrichSubmitted,
};
