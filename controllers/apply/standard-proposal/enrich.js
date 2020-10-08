'use strict';
const get = require('lodash/fp/get');

const { findLocationName } = require('./lib/locations');

const formBuilder = require('./form');
const formBuilderV2 = require('../standard-proposal-v2/form');
const config = require('config');
const enableStandardV2 = config.get('standardFundingProposal.enablev2');

function details(application, data, locale) {
    const localise = get(locale);

    function formatYears(value) {
        return `${value} ${localise({
            en: 'years',
            cy: 'blynedd',
        })}`;
    }

    const countries = get('projectCountries')(data);

    return {
        projectName: data.projectName,
        untitledName: localise({
            en: `Untitled proposal`,
            cy: `Cynnig heb deitl`,
        }),
        projectCountry: countries
            ? countries.length === 1
                ? countries[0]
                : 'Multiple'
            : null,
        get amountRequested() {
            const value = data.projectCosts || 0;
            return `£${value.toLocaleString()}`;
        },
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
    const form = enableStandardV2
        ? formBuilderV2({ locale, data })
        : formBuilder({ locale, data });

    const defaults = {
        type: 'pending',
        id: application.id,
        formId: application.formId,
        createdAt: application.createdAt,
        expiresAt: application.expiresAt,
        isExpired: application.isExpired,
        updatedAt: application.updatedAt,
        progress: form.progress,
        editUrl: enableStandardV2
            ? `/apply/your-funding-proposal-v2/edit/${application.id}`
            : `/apply/your-funding-proposal/edit/${application.id}`,
        deleteUrl: enableStandardV2
            ? `/apply/your-funding-proposal-v2/delete/${application.id}`
            : `/apply/your-funding-proposal/delete/${application.id}`,
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
