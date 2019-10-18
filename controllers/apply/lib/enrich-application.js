'use strict';
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const sumBy = require('lodash/sumBy');

const { formatDateRange } = require('./formatters');
const awardsForAllFormBuilder = require('../awards-for-all/form');
const getAdviceFormBuilder = require('../get-advice/form');

function formBuilderFor(formId) {
    return formId === 'standard-enquiry'
        ? getAdviceFormBuilder
        : awardsForAllFormBuilder;
}

function enrichPendingApplication(application, locale) {
    const data = application.applicationData;
    const form = formBuilderFor(application.formId)({ locale, data });
    const localise = get(locale);

    if (application.formId === 'standard-enquiry') {
        return {
            type: 'pending',
            id: application.id,
            formId: application.formId,
            projectName: getOr(
                localise({ en: 'Untitled proposal', cy: '' }),
                'projectName'
            )(data),
            amountRequested: `£${data.projectCosts.toLocaleString()}`,
            overview: [
                {
                    label: 'Project length',
                    value: `${data.projectDurationYears} years`
                },
                {
                    label: 'Location',
                    value: data.projectLocation
                },
                {
                    label: 'Organisation',
                    value:
                        data.organisationTradingName ||
                        data.organisationLegalName
                }
            ],
            progress: form.progress,
            expiresAt: application.expiresAt,
            updatedAt: application.updatedAt
        };
    } else {
        return {
            type: 'pending',
            id: application.id,
            formId: application.formId,
            projectName: getOr(
                localise({ en: 'Untitled application', cy: 'Cais heb deitl' }),
                'projectName'
            )(data),
            amountRequested: `£${sumBy(
                getOr([], 'projectBudget', data),
                item => parseInt(item.cost, 10) || 0
            ).toLocaleString()}`,
            overview: [
                {
                    label: 'Project dates',
                    value: formatDateRange(locale)(data.projectDateRange)
                },
                {
                    label: 'Location',
                    value: data.projectLocation
                },
                {
                    label: 'Organisation',
                    value:
                        data.organisationTradingName ||
                        data.organisationLegalName
                }
            ],
            progress: form.progress,
            expiresAt: application.expiresAt,
            updatedAt: application.updatedAt
        };
    }
}

function enrichSubmittedApplication(application) {
    const data = application.salesforceSubmission.application;

    if (application.formId === 'standard-enquiry') {
        return {
            type: 'submitted',
            id: application.id,
            formId: application.formId,
            projectName: data.projectName,
            amountRequested: `£${data.projectCosts.toLocaleString()}`,
            overview: [
                {
                    label: 'Project length',
                    value: `${data.projectDurationYears} years`
                },
                {
                    label: 'Location',
                    value: data.projectLocation
                },
                {
                    label: 'Organisation',
                    value:
                        data.organisationTradingName ||
                        data.organisationLegalName
                }
            ],
            submittedAt: application.createdAt,
            link: {
                url: `/apply/get-advice/edit/${application.id}`,
                label: 'Continue'
            }
        };
    } else {
        return {
            type: 'submitted',
            id: application.id,
            formId: application.formId,
            projectName: data.projectName,
            amountRequested: `£${sumBy(
                getOr([], 'projectBudget', data),
                item => parseInt(item.cost, 10) || 0
            ).toLocaleString()}`,
            overview: [
                {
                    label: 'Project dates',
                    value: '2 December, 2020–2 December, 2020'
                },
                {
                    label: 'Location',
                    value: 'Sutton Coldfield'
                },
                {
                    label: 'Organisation',
                    value: 'The Scouts of Sutton Coldfield'
                }
            ],
            submittedAt: application.createdAt
        };
    }
}

module.exports = {
    enrichPendingApplication,
    enrichSubmittedApplication
};
