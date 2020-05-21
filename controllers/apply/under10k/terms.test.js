/* eslint-env jest */
'use strict';
const terms = require('./terms');

test('default terms', function () {
    expect(terms('en', {}, { enableGovCOVIDUpdates: true })).toMatchSnapshot();
});

test('england specific terms', function () {
    const defaultTerms = terms('en', { enableGovCOVIDUpdates: true });
    const englandTerms = terms(
        'en',
        { projectCountry: 'england' },
        { enableGovCOVIDUpdates: true }
    );
    const scotlandTerms = terms(
        'en',
        { projectCountry: 'scotland' },
        { enableGovCOVIDUpdates: true }
    );

    expect(englandTerms).toMatchSnapshot();

    expect(scotlandTerms).toStrictEqual(defaultTerms);
    expect(englandTerms).not.toStrictEqual(scotlandTerms);
});

test('no change in terms when enableGovCOVIDUpdates is false', function () {
    expect(terms('en')).toStrictEqual(
        terms(
            'en',
            { projectCountry: 'england' },
            { enableGovCOVIDUpdates: false }
        )
    );
});
