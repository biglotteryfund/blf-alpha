/* eslint-env jest */
'use strict';
const { mockResponse } = require('./mocks');
const { enrichPending, enrichSubmitted } = require('./enrich');

test('enrich pending applications', function() {
    const result = enrichPending({
        id: 'some-uuid',
        formId: 'standard-enquiry',
        createdAt: '2020-03-04T23:00:00.000Z',
        expiresAt: '2020-03-04T23:00:00.000Z',
        updatedAt: '2020-03-04T23:00:00.000Z',
        applicationData: mockResponse()
    });

    expect(result).toMatchSnapshot({
        progress: expect.any(Object)
    });
});

test('enrich submitted applications', function() {
    const result = enrichSubmitted({
        id: 'some-uuid',
        formId: 'awards-for-all',
        createdAt: '2020-03-04T23:00:00.000Z',
        salesforceSubmission: {
            application: mockResponse()
        }
    });

    expect(result).toMatchSnapshot();
});
