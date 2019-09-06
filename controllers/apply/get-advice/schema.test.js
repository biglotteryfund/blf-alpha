/* eslint-env jest */
// @ts-nocheck
'use strict';
const omit = require('lodash/omit');
const random = require('lodash/random');
const faker = require('faker');

const schema = require('./schema');

function validate(data) {
    return schema.validate(data, { abortEarly: false });
}

function mapMessages(validationResult) {
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
        organisationTradingName: 'Example trading name'
    };

    return Object.assign(defaults, overrides);
}

test('minimal valid form', () => {
    const result = validate(mockResponse());
    expect(result.error).toBeNull();

    expect(result.value).toEqual({
        projectCountry: ['england'],
        projectLocation: 'placeholder-location',
        projectLocationDescription: 'optional description',
        projectCosts: 250000,
        projectDurationYears: 3,
        projectIdea: expect.any(String),
        organisationLegalName: 'Example organisation',
        organisationTradingName: 'Example trading name'
    });
});

test('minimal invalid form', () => {
    const result = validate({
        projectCountry: 'invalid-country',
        projectLocation: null,
        projectCosts: 5000,
        projectDurationYears: 10
    });

    expect(mapMessages(result)).toEqual([
        '"projectCountry" must be one of [england, scotland, northern-ireland, wales]',
        '"projectLocation" must be a string',
        '"projectCosts" must be larger than or equal to 10000',
        '"projectDurationYears" must be less than or equal to 5',
        '"projectIdea" is required',
        '"organisationLegalName" is required'
    ]);
});

test('strip location when applying for more than one country', () => {
    const result = validate(
        mockResponse({
            projectCountry: ['england', 'scotland'],
            projectLocation: 'this-should-be-stripped'
        })
    );

    expect(result.value).not.toHaveProperty('projectLocation');
});

test('optional project location description', () => {
    const expected = omit(mockResponse(), 'projectLocationDescription');
    const result = validate(expected);
    expect(result.error).toBeNull();
});

test.each([
    ['england', 1, 5],
    ['northern-ireland', 1, 5],
    ['scotland', 3, 5],
    ['wales', 1, 5]
])('project duration in %p is %p–%p years', function(country, min, max) {
    const result = validate(
        mockResponse({
            projectCountry: country,
            projectDurationYears: random(min, max)
        })
    );
    expect(result.error).toBeNull();

    const resultMin = validate({
        projectCountry: country,
        projectDurationYears: min - 1
    });

    expect(mapMessages(resultMin)).toEqual(
        expect.arrayContaining([
            `"projectDurationYears" must be larger than or equal to ${min}`
        ])
    );

    const resultMax = validate({
        projectCountry: country,
        projectDurationYears: max + 1
    });

    expect(mapMessages(resultMax)).toEqual(
        expect.arrayContaining([
            `"projectDurationYears" must be less than or equal to ${max}`
        ])
    );
});

test('strip project duration when applying for more than one country', () => {
    const result = validate(
        mockResponse({
            projectCountry: ['england', 'scotland'],
            projectDurationYears: 'this-should-be-stripped'
        })
    );

    expect(result.value).not.toHaveProperty('projectDurationYears');
});

test('project idea must be within word-count', () => {
    const resultMin = validate(
        mockResponse({
            projectIdea: faker.lorem.words(49)
        })
    );

    expect(mapMessages(resultMin)).toEqual(
        expect.arrayContaining(['"projectIdea" must have at least 50 words'])
    );

    const resultMax = validate(
        mockResponse({
            projectIdea: faker.lorem.words(501)
        })
    );

    expect(mapMessages(resultMax)).toEqual(
        expect.arrayContaining(['"projectIdea" must have less than 500 words'])
    );
});

test('optional organisational trading name', () => {
    const expected = omit(mockResponse(), 'organisationTradingName');
    const result = validate(expected);
    expect(result.error).toBeNull();
});
