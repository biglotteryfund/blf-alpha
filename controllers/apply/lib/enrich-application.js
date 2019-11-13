'use strict';
const get = require('lodash/fp/get');
const moment = require('moment');
const sumBy = require('lodash/sumBy');
const toInteger = require('lodash/toInteger');

const awardsForAllFormBuilder = require('../awards-for-all/form');
const standardProposalFormBuilder = require('../standard-proposal/form');

const { findLocationName } = require('./location-options');
const { formatCurrency, formatDateRange } = require('./formatters');

function formBuilderFor(formId) {
    return formId === 'standard-enquiry'
        ? standardProposalFormBuilder
        : awardsForAllFormBuilder;
}

function formatCreatedAt(createdAt, locale) {
    return moment(createdAt)
        .locale(locale)
        .format('DD/MM/YYYY h:mm a');
}

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

function simpleDetails(data, locale) {
    const localise = get(locale);

    const createdDate = formatCreatedAt(data.createdAt, locale);

    return {
        projectName:
            data.projectName ||
            localise({
                en: `Untitled application - ${createdDate}`,
                cy: `Cais heb deitl - ${createdDate}`
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

function standardDetails(data, locale) {
    const localise = get(locale);

    const createdDate = formatCreatedAt(data.createdAt, locale);

    return {
        projectName:
            data.projectName ||
            localise({
                en: `Untitled proposal - ${createdDate}`,
                cy: `Cynnig heb deitl - ${createdDate}`
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

function enrichPending(application, locale) {
    const data = application.applicationData || {};
    const formBuilder = formBuilderFor(application.formId);
    const form = formBuilder({ locale, data });

    function createPending(details) {
        return Object.assign(
            {
                type: 'pending',
                id: application.id,
                formId: application.formId,
                expiresAt: application.expiresAt,
                updatedAt: application.updatedAt,
                progress: form.progress
            },
            details
        );
    }

    if (application.formId === 'standard-enquiry') {
        return createPending({
            projectName: standardDetails(data, locale).projectName,
            amountRequested: standardDetails(data, locale).amountRequested,
            overview: standardDetails(data, locale).overview,
            editUrl: `/apply/your-funding-proposal/edit/${application.id}`,
            deleteUrl: `/apply/your-funding-proposal/delete/${application.id}`
        });
    } else {
        return createPending({
            projectName: simpleDetails(data, locale).projectName,
            amountRequested: simpleDetails(data, locale).amountRequested,
            overview: simpleDetails(data, locale).overview,
            editUrl: `/apply/awards-for-all/edit/${application.id}`,
            deleteUrl: `/apply/awards-for-all/delete/${application.id}`
        });
    }
}

function enrichSubmitted(application, locale) {
    const data = application.salesforceSubmission.application;

    function createSubmitted(details) {
        return Object.assign(
            {
                type: 'submitted',
                id: application.id,
                formId: application.formId,
                submittedAt: application.createdAt
            },
            details
        );
    }

    if (application.formId === 'standard-enquiry') {
        return createSubmitted({
            projectName: standardDetails(data, locale).projectName,
            amountRequested: standardDetails(data, locale).amountRequested,
            overview: standardDetails(data, locale).overview
        });
    } else {
        return createSubmitted({
            projectName: simpleDetails(data, locale).projectName,
            amountRequested: simpleDetails(data, locale).amountRequested,
            overview: simpleDetails(data, locale).overview
        });
    }
}

module.exports = {
    enrichPending,
    enrichSubmitted
};
