'use strict';
const get = require('lodash/fp/get');

const { findLocationName } = require('../lib/location-options');
const { formatCurrency } = require('../lib/formatters');

const formBuilder = require('./form');

function details(application, data, locale) {
    const localise = get(locale);

    function formatYears(value) {
        return `${value} ${localise({
            en: 'years',
            cy: 'blynedd',
        })}`;
    }

    return {
        projectName: data.projectName,
        untitledName: localise({
            en: `Untitled proposal`,
            cy: `Cynnig heb deitl`,
        }),
        amountRequested: formatCurrency(data.projectCosts || 0),
        overview: [
            {
                label: localise({ en: 'Project length', cy: 'Hyd y prosiect' }),
                value: data.projectDurationYears
                    ? formatYears(data.projectDurationYears)
                    : null,
            },
            {
                label: localise({ en: 'Location', cy: 'Lleoliad' }),
                value: findLocationName(data.projectLocation),
            },
            {
                label: localise({ en: 'Organisation', cy: 'Mudiad' }),
                value:
                    data.organisationTradingName || data.organisationLegalName,
            },
        ],
    };
}

function enrichPending(application, locale = 'en') {
    const data = application.applicationData || {};
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
        editUrl: `/apply/your-funding-proposal/edit/${application.id}`,
        deleteUrl: `/apply/your-funding-proposal/delete/${application.id}`,
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
