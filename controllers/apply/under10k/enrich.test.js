/* eslint-env jest */
'use strict';
const moment = require('moment-timezone');

const { toDateParts } = require('./mocks');
const { enrichPending, enrichSubmitted } = require('./enrich');

test('enrich pending applications', function () {
    const resultAsap = enrichPending({
        id: 'some-uuid',
        formId: 'awards-for-all',
        createdAt: '2020-03-04T12:00:00.000Z',
        expiresAt: '2020-03-04T12:00:00.000Z',
        isExpired: false,
        updatedAt: '2020-03-04T12:00:00.000Z',
        applicationData: {
            projectName: 'Example project',
            projectCountry: 'england',
            projectLocation: 'derbyshire',
            projectStartDateCheck: 'asap',
            projectEndDate: toDateParts(
                moment('2020-06-04T12:00:00.000Z').tz('Europe/London')
            ),
            organisationLegalName: 'Example organisation',
            organisationHasDifferentTradingName: 'yes',
            organisationTradingName: 'Example organisation trading name',
            projectBudget: [
                { item: 'item 1', cost: 1000 },
                { item: 'item 1', cost: 350 },
                { item: 'item 1', cost: 5400 },
            ],
        },
    });

    expect(resultAsap).toMatchSnapshot({
        progress: expect.any(Object),
    });

    const resultExactDate = enrichPending({
        id: 'some-uuid',
        formId: 'awards-for-all',
        createdAt: '2020-03-04T12:00:00.000Z',
        expiresAt: '2020-03-04T12:00:00.000Z',
        isExpired: false,
        updatedAt: '2020-03-04T12:00:00.000Z',
        applicationData: {
            projectName: 'Example project',
            projectCountry: 'scotland',
            projectLocation: 'fife',
            projectStartDateCheck: 'exact-date',
            projectStartDate: toDateParts(
                moment('2021-06-04T12:00:00.000Z').tz('Europe/London')
            ),
            projectEndDate: toDateParts(
                moment('2021-09-10T12:00:00.000Z').tz('Europe/London')
            ),
            organisationLegalName: 'Example organisation',
            organisationHasDifferentTradingName: 'yes',
            organisationTradingName: 'Example organisation trading name',
            projectBudget: [
                { item: 'item 1', cost: 1000 },
                { item: 'item 1', cost: 350 },
                { item: 'item 1', cost: 5400 },
            ],
        },
    });

    expect(resultExactDate).toMatchSnapshot({
        progress: expect.any(Object),
    });
});

test('enrich submitted applications', function () {
    const projectDate = moment('2020-06-04T12:00:00.000Z').tz('Europe/London');

    const resultAsap = enrichSubmitted({
        id: 'some-uuid',
        formId: 'awards-for-all',
        createdAt: '2020-03-04T12:00:00.000Z',
        salesforceSubmission: {
            application: {
                projectName: 'Example project',
                projectStartDateCheck: 'asap',
                projectEndDate: projectDate.toISOString(),
                projectLocation: 'derbyshire',
                organisationLegalName: 'Example organisation',
                organisationTradingName: 'Example organisation trading name',
                projectBudget: [
                    { item: 'item 1', cost: 1000 },
                    { item: 'item 1', cost: 350 },
                    { item: 'item 1', cost: 5400 },
                ],
            },
        },
    });

    expect(resultAsap).toMatchSnapshot();

    const resultExactDate = enrichSubmitted({
        id: 'some-uuid',
        formId: 'awards-for-all',
        createdAt: '2020-03-04T12:00:00.000Z',
        salesforceSubmission: {
            application: {
                projectName: 'Example project',
                projectCountry: 'scotland',
                projectLocation: 'fife',
                projectStartDateCheck: 'exact-date',
                projectStartDate: moment('2021-06-04T12:00:00.000Z')
                    .tz('Europe/London')
                    .toISOString(),
                projectEndDate: moment('2021-09-10T12:00:00.000Z')
                    .tz('Europe/London')
                    .toISOString(),
                organisationLegalName: 'Example organisation',
                organisationTradingName: 'Example organisation trading name',
                projectBudget: [
                    { item: 'item 1', cost: 1000 },
                    { item: 'item 1', cost: 350 },
                    { item: 'item 1', cost: 5400 },
                ],
            },
        },
    });

    expect(resultExactDate).toMatchSnapshot();
});
