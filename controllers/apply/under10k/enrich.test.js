/* eslint-env jest */
'use strict';
const moment = require('moment-timezone');

const { toDateParts } = require('./mocks');
const { enrichPending, enrichSubmitted } = require('./enrich');

test('enrich pending applications', function () {
    function mock(applicationData) {
        return {
            id: 'some-uuid',
            formId: 'awards-for-all',
            createdAt: '2020-03-04T12:00:00.000Z',
            expiresAt: '2020-03-04T12:00:00.000Z',
            isExpired: false,
            updatedAt: '2020-03-04T12:00:00.000Z',
            applicationData: applicationData,
        };
    }

    const resultAsap = enrichPending(
        mock({
            projectName: 'Example project',
            projectCountry: 'england',
            projectLocation: 'derbyshire',
            projectStartDateCheck: 'asap',
            projectStartDate: toDateParts(
                moment('2020-11-11T12:00:00.000Z').tz('Europe/London')
            ),
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
        })
    );

    expect(resultAsap.amountRequested).toBe('£6,750');
    expect(resultAsap.overview).toStrictEqual([
        { label: 'Project dates', value: '11 November, 2020–4 June, 2020' },
        { label: 'Location', value: 'Derbyshire' },
        { label: 'Organisation', value: 'Example organisation trading name' },
    ]);

    const resultExactDate = enrichPending(
        mock({
            projectName: 'Example project',
            projectCountry: 'scotland',
            projectLocation: 'fife',
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
        })
    );

    expect(resultExactDate.amountRequested).toBe('£6,750');
    expect(resultExactDate.overview).toStrictEqual([
        { label: 'Project dates', value: '4 June, 2021–10 September, 2021' },
        { label: 'Location', value: 'Fife' },
        { label: 'Organisation', value: 'Example organisation trading name' },
    ]);
});

test('enrich submitted applications', function () {
    function mock(applicationData) {
        return {
            id: 'some-uuid',
            formId: 'awards-for-all',
            createdAt: '2020-03-04T12:00:00.000Z',
            salesforceSubmission: {
                application: applicationData,
            },
        };
    }

    const resultAsap = enrichSubmitted(
        mock({
            projectName: 'Example project',
            projectStartDateCheck: 'asap',
            projectStartDate: toDateParts(
                moment('2020-11-11T12:00:00.000Z').tz('Europe/London')
            ),
            projectEndDate: moment('2020-06-04T12:00:00.000Z')
                .tz('Europe/London')
                .toISOString(),
            projectLocation: 'derbyshire',
            organisationLegalName: 'Example organisation',
            organisationTradingName: 'Example organisation trading name',
            projectBudget: [
                { item: 'item 1', cost: 1000 },
                { item: 'item 1', cost: 350 },
                { item: 'item 1', cost: 5400 },
            ],
        })
    );

    expect(resultAsap.amountRequested).toBe('£6,750');
    expect(resultAsap.overview).toStrictEqual([
        { label: 'Project dates', value: '11 November, 2020–4 June, 2020' },
        { label: 'Location', value: 'Derbyshire' },
        { label: 'Organisation', value: 'Example organisation trading name' },
    ]);

    const resultExactDate = enrichSubmitted(
        mock({
            projectName: 'Example project',
            projectCountry: 'scotland',
            projectLocation: 'fife',
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
        })
    );

    expect(resultExactDate.amountRequested).toBe('£6,750');
    expect(resultExactDate.overview).toStrictEqual([
        { label: 'Project dates', value: '4 June, 2021–10 September, 2021' },
        { label: 'Location', value: 'Fife' },
        { label: 'Organisation', value: 'Example organisation trading name' },
    ]);
});
