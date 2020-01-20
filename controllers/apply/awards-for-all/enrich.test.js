/* eslint-env jest */
'use strict';
const moment = require('moment-timezone');

const { toDateParts, mockResponse } = require('./mocks');
const { enrichPending, enrichSubmitted } = require('./enrich');

test('enrich pending applications', function() {
    const projectDate = moment('2020-06-04T12:00:00.000Z').tz('Europe/London');

    const result = enrichPending({
        id: 'some-uuid',
        formId: 'awards-for-all',
        createdAt: '2020-03-04T12:00:00.000Z',
        expiresAt: '2020-03-04T12:00:00.000Z',
        isExpired: false,
        updatedAt: '2020-03-04T12:00:00.000Z',
        applicationData: mockResponse({
            projectName: 'Example project',
            projectStartDate: toDateParts(projectDate),
            projectEndDate: toDateParts(projectDate),
            projectLocation: 'derbyshire',
            organisationLegalName: 'Example organisation',
            organisationHasDifferentTradingName: 'yes',
            organisationTradingName: 'Example organisation trading name',
            projectBudget: [
                { item: 'item 1', cost: 1000 },
                { item: 'item 1', cost: 350 },
                { item: 'item 1', cost: 5400 }
            ]
        })
    });

    expect(result).toMatchSnapshot({
        progress: expect.any(Object)
    });
});

test('enrich submitted applications', function() {
    const projectDate = moment('2020-06-04T12:00:00.000Z').tz('Europe/London');

    const result = enrichSubmitted({
        id: 'some-uuid',
        formId: 'awards-for-all',
        createdAt: '2020-03-04T12:00:00.000Z',
        salesforceSubmission: {
            application: mockResponse({
                projectName: 'Example project',
                projectStartDate: projectDate.toISOString(),
                projectEndDate: projectDate.toISOString(),
                projectLocation: 'derbyshire',
                organisationLegalName: 'Example organisation',
                organisationTradingName: 'Example organisation trading name',
                projectBudget: [
                    { item: 'item 1', cost: 1000 },
                    { item: 'item 1', cost: 350 },
                    { item: 'item 1', cost: 5400 }
                ]
            })
        }
    });

    expect(result).toMatchSnapshot();
});
