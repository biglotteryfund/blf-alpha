/* eslint-env jest */
'use strict';
const {
    fieldProjectStartDateCheck,
    fieldProjectEndDate,
} = require('./project-dates-next');

describe('fieldProjectStartDateCheck', function () {
    test('both options enabled by default', function () {
        const field = fieldProjectStartDateCheck('en');
        expect(field.options).toStrictEqual([
            { label: expect.any(String), value: 'asap' },
            { label: expect.any(String), value: 'exact-date' },
        ]);
    });

    test('exact date disabled in England', function () {
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

    test('exact date disabled outside England when project is responding to COVID-19', function () {
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
});

describe('fieldProjectEndDate', function () {
    test('guidance states 6 months in England', function () {
        const field = fieldProjectEndDate('en', {
            projectCountry: 'england',
        });
        expect(field.explanation).toMatchSnapshot();
    });

    test('guidance states 12 months outside England', function () {
        const field = fieldProjectEndDate('en', {
            projectCountry: 'scotland',
        });
        expect(field.explanation).toMatchSnapshot();
    });

    test('guidance states 12 months when no country is selected', function () {
        const field = fieldProjectEndDate('en');
        expect(field.explanation).toMatchSnapshot();
    });
});
