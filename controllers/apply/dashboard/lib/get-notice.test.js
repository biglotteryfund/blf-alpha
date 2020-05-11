/* eslint-env jest */
'use strict';
const getNotice = require('./get-notice');

test('get notice if pending under £10,000 application in England', function () {
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

    const resultEn = getNotice('en', [
        mockUnder10kEngland,
        mockUnder10kEmpty,
        mockOver10k,
    ]);

    expect(resultEn).toMatchSnapshot();

    const resultCy = getNotice('cy', [
        mockUnder10kEngland,
        mockUnder10kEmpty,
        mockOver10k,
    ]);

    expect(resultCy).toMatchSnapshot();

    const noResult = getNotice('en', [mockUnder10kEmpty, mockOver10k]);
    expect(noResult).toBeUndefined();
});
