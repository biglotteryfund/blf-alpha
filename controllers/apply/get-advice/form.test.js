/* eslint-env jest */
'use strict';
const omit = require('lodash/omit');
const random = require('lodash/random');
const faker = require('faker');

const formBuilder = require('./form');

function mapMessages(validationResult) {
    return validationResult.messages.map(detail => detail.msg);
}

function mapRawMessages(validationResult) {
    return validationResult.error.details.map(detail => {
        return detail.message;
    });
}

function mockResponse(overrides) {
    const defaults = {
        projectCountry: 'england',
        projectLocation: 'placeholder-location',
        projectLocationDescription: 'optional description',
        projectCosts: '250,000',
        projectDurationYears: 3,
        projectIdea: faker.lorem.words(random(50, 500)),
        organisationLegalName: 'Example organisation',
        organisationTradingName: 'Example trading name',
        organisationAddress: {
            line1: '1234 example street',
            townCity: 'Birmingham',
            county: 'West Midlands',
            postcode: 'B15 1TR'
        },
        organisationType: 'Social enterprise',
        organisationBackground: faker.lorem.words(random(50, 500)),
        contactName: {
            firstName: 'Björk',
            lastName: 'Guðmundsdóttir'
        },
        contactEmail: 'general.enquiries@tnlcommunityfund.org.uk',
        contactPhone: '0345 4 10 20 30'
    };

    return Object.assign(defaults, overrides);
}

test('minimal valid form', () => {
    const form = formBuilder();
    const result = form.validate(mockResponse());
    expect(result.error).toBeNull();
    expect(result.value).toMatchSnapshot({
        projectIdea: expect.any(String),
        organisationBackground: expect.any(String)
    });
});

test('minimal invalid form', () => {
    const form = formBuilder();

    const result = form.validate({
        projectCountry: 'invalid-country',
        projectLocation: null,
        projectCosts: 5000,
        projectDurationYears: 10
    });

    expect(mapMessages(result)).toMatchSnapshot();

    expect(mapRawMessages(result)).toMatchSnapshot();
});

test('strip location and duration when applying for more than one country', () => {
    const form = formBuilder();

    const result = form.validate(
        mockResponse({
            projectCountry: ['england', 'scotland'],
            projectLocation: 'this-should-be-stripped',
            projectDurationYears: 5
        })
    );

    expect(result.value).not.toHaveProperty('projectLocation');
    expect(result.value).not.toHaveProperty('projectDurationYears');
});

test.each([
    ['england', 1, 5],
    ['northern-ireland', 1, 5],
    ['scotland', 3, 5],
    ['wales', 1, 5]
])('project duration in %p is %p–%p years', function(country, min, max) {
    const form = formBuilder();

    const result = form.validate(
        mockResponse({
            projectCountry: country,
            projectDurationYears: random(min, max)
        })
    );
    expect(result.error).toBeNull();

    const resultMin = form.validate({
        projectCountry: country,
        projectDurationYears: min - 1
    });

    expect(mapRawMessages(resultMin)).toEqual(
        expect.arrayContaining([
            `"projectDurationYears" must be larger than or equal to ${min}`
        ])
    );

    const resultMax = form.validate({
        projectCountry: country,
        projectDurationYears: max + 1
    });

    expect(mapRawMessages(resultMax)).toEqual(
        expect.arrayContaining([
            `"projectDurationYears" must be less than or equal to ${max}`
        ])
    );
});

test.each([['projectIdea', 50, 500], ['organisationBackground', 50, 500]])(
    '%p must be within word-count',
    function(fieldName, min, max) {
        const form = formBuilder();

        const resultMin = form.validate(
            mockResponse({
                [fieldName]: faker.lorem.words(min - 1)
            })
        );

        expect(mapMessages(resultMin)).toEqual(
            expect.arrayContaining([`Answer must be at least ${min} words`])
        );

        const resultMax = form.validate(
            mockResponse({
                [fieldName]: faker.lorem.words(max + 1)
            })
        );

        expect(mapMessages(resultMax)).toEqual(
            expect.arrayContaining([`Answer must be no more than ${max} words`])
        );
    }
);

test('project costs must be at least 10,000', function() {
    const form = formBuilder();

    const resultMin = form.validate(
        mockResponse({
            projectCosts: '5,500'
        })
    );

    expect(mapMessages(resultMin)).toEqual(
        expect.arrayContaining(['Must be at least £10,000'])
    );
});

test.each([
    'projectLocationDescription',
    'organisationTradingName',
    'contactPhone'
])('optional %p field', function(fieldName) {
    const form = formBuilder();

    const expected = omit(mockResponse(), fieldName);
    const result = form.validate(expected);
    expect(result.error).toBeNull();
});
