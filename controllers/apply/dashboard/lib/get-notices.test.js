/* eslint-env jest */
'use strict';
const getNotices = require('./get-notices');

test('show for pending under £10,000 application in England', function () {
    const mockUnder10kEngland = {
        formId: 'awards-for-all',
        createdAt: '2020-05-11T10:39:24.000Z',
        applicationData: { projectCountry: 'england' },
    };

    const mockUnder10kEmpty = {
        formId: 'awards-for-all',
        createdAt: '2020-05-11T10:39:24.000Z',
        applicationData: null,
    };

    const mockOver10k = {
        formId: 'standard-enquiry',
        createdAt: '2020-05-11T10:39:24.000Z',
        applicationData: { projectCountries: ['england'] },
    };

    const resultEn = getNotices('en', [
        mockUnder10kEngland,
        mockUnder10kEmpty,
        mockOver10k,
    ]);

    expect(resultEn).toMatchSnapshot();

    const resultCy = getNotices('cy', [
        mockUnder10kEngland,
        mockUnder10kEmpty,
        mockOver10k,
    ]);

    expect(resultCy).toMatchSnapshot();

    const noResult = getNotices('en', [mockUnder10kEmpty, mockOver10k]);
    expect(noResult).toHaveLength(0);
});

test(`don't show notice for pending under £10,000 application in England before a fixed date`, function () {
    const mock = {
        formId: 'awards-for-all',
        createdAt: '2020-05-13T10:39:24.000Z',
        applicationData: { projectCountry: 'england' },
    };

    const noResult = getNotices('en', [mock]);
    expect(noResult).toHaveLength(0);
});
