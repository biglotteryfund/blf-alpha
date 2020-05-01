/* eslint-env jest */
'use strict';
const { fieldProjectStartDateCheck } = require('./project-dates-next');

test('fieldProjectStartDateCheck both options enabled by default', function () {
    const field = fieldProjectStartDateCheck('en');
    expect(field.options).toStrictEqual([
        { label: expect.any(String), value: 'asap' },
        { label: expect.any(String), value: 'exact-date' },
    ]);
});

test('fieldProjectStartDateCheck exact date disabled in England', function () {
    const field = fieldProjectStartDateCheck('en', {
        projectCountry: 'england',
    });
    expect(field.options).toStrictEqual([
        {
            value: 'asap',
            label: expect.any(String),
        },
        {
            value: 'exact-date',
            label: expect.any(String),
            attributes: { disabled: 'disabled' },
        },
    ]);
});

test('fieldProjectStartDateCheck exact date disabled outside England when project is responding to COVID-19', function () {
    const field = fieldProjectStartDateCheck('en', {
        projectCountry: 'scotland',
        supportingCOVID19: 'yes',
    });
    expect(field.options).toStrictEqual([
        {
            value: 'asap',
            label: expect.any(String),
        },
        {
            value: 'exact-date',
            label: expect.any(String),
            attributes: { disabled: 'disabled' },
        },
    ]);
});
