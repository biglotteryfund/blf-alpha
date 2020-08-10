'use strict';
const get = require('lodash/fp/get');
const moment = require('moment');

const { formatCurrency } = require('../lib/formatters');
const { findLocationName } = require('./lib/locations');

const formBuilder = require('./form');

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
    const applicationDetails = details(application, data, locale);

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

    // @TODO remove this logic after August 17th
    if (applicationDetails.projectCountry === 'england') {
        const englandCcsfExpiryDate = moment('2020-08-17 12:00');
        if (moment(defaults.expiresAt).isAfter(englandCcsfExpiryDate)) {
            defaults.expiresAt = englandCcsfExpiryDate.toISOString();
        }
    }

    return Object.assign(defaults, applicationDetails);
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
