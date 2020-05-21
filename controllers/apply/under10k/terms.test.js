/* eslint-env jest */
'use strict';
const terms = require('./terms');

test('default terms', function () {
    expect(terms('en')).toMatchSnapshot();
});

test('england specific terms', function () {
    const defaultTerms = terms('en');
    const englandTerms = terms('en', { projectCountry: 'england' });
    const scotlandTerms = terms('en', { projectCountry: 'scotland' });

    expect(englandTerms).toMatchSnapshot();

    expect(scotlandTerms).toStrictEqual(defaultTerms);
    expect(englandTerms).not.toStrictEqual(scotlandTerms);
});
