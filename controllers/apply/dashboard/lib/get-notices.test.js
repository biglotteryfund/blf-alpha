/* eslint-env jest */
'use strict';
const getNotices = require('./get-notices');

test('get notices for pending under £10,000 application in England', function () {
    const mockUnder10kEngland = {
        formId: 'awards-for-all',
        applicationData: { projectCountry: 'england' },
    };

    const mockUnder10kEmpty = {
        formId: 'awards-for-all',
        applicationData: null,
    };

    const mockOver10k = {
        formId: 'standard-enquiry',
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
