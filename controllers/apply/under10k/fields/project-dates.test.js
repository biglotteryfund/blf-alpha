/* eslint-env jest */
'use strict';
const {
    _getLeadTimeWeeks,
    fieldProjectStartDateCheck,
    fieldProjectEndDate,
} = require('./project-dates');

test('lead time conditional on country', () => {
    expect(_getLeadTimeWeeks('england')).toBe(12);

    expect(_getLeadTimeWeeks('wales')).toBe(12);
    expect(_getLeadTimeWeeks('scotland')).toBe(12);
    expect(_getLeadTimeWeeks('northern-ireland')).toBe(12);
});

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
                explanation:
                    'We expect you will start spending emergency funding straight away',
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

    test('asap disabled outside England when project is not responding to COVID-19', function () {
        const field = fieldProjectStartDateCheck('en', {
            projectCountry: 'scotland',
            supportingCOVID19: 'no',
        });

        expect(field.options).toStrictEqual([
            {
                value: 'asap',
                label: expect.any(String),
                attributes: { disabled: 'disabled' },
            },
            {
                value: 'exact-date',
                label: expect.any(String),
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
