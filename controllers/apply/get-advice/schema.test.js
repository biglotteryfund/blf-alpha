/* eslint-env jest */
// @ts-nocheck
'use strict';
const omit = require('lodash/omit');
const random = require('lodash/random');
const faker = require('faker');
const { oneLine } = require('common-tags');

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
    const placeholderText = oneLine`Turnip greens yarrow ricebean rutabaga 
        endive cauliflower sea lettuce kohlrabi amaranth water spinach avocado
        daikon napa cabbage asparagus winter purslane kale. Celery potato
        scallion desert raisin horseradish spinach carrot soko. Lotus root
        water spinach fennel kombu maize bamboo shoot green bean swiss
        chard seakale pumpkin onion chickpea gram corn pea. Brussels
        sprout coriander water chestnut gourd swiss chard wakame kohlrabi
        beetroot carrot watercress. Corn amaranth salsify bunya nuts nori
        azuki bean chickweed potato bell pepper artichoke.`;

    const defaults = {
        projectCountry: 'england',
        projectLocation: 'placeholder-location',
        projectLocationDescription: 'optional description',
        projectCosts: '250,000',
        projectDurationYears: 3,
        projectIdea: placeholderText,
        organisationLegalName: 'Example organisation',
        organisationTradingName: 'Example trading name',
        organisationAddress: {
            line1: '1234 example street',
            townCity: 'Birmingham',
            county: 'West Midlands',
            postcode: 'B15 1TR'
        },
        organisationType: 'Social enterprise',
        organisationBackground: placeholderText,
        contactName: {
            firstName: 'Björk',
            lastName: 'Guðmundsdóttir'
        }
    };

    return Object.assign(defaults, overrides);
}

test('minimal valid form', () => {
    const result = validate(mockResponse());
    expect(result.error).toBeNull();
    expect(result.value).toMatchSnapshot();
});

test('minimal invalid form', () => {
    const result = validate({
        projectCountry: 'invalid-country',
        projectLocation: null,
        projectCosts: 5000,
        projectDurationYears: 10
    });

    expect(mapMessages(result)).toMatchSnapshot();
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

test('organisation background must be within word-count', () => {
    const resultMin = validate(
        mockResponse({
            organisationBackground: faker.lorem.words(49)
        })
    );

    expect(mapMessages(resultMin)).toEqual(
        expect.arrayContaining([
            '"organisationBackground" must have at least 50 words'
        ])
    );

    const resultMax = validate(
        mockResponse({
            organisationBackground: faker.lorem.words(501)
        })
    );

    expect(mapMessages(resultMax)).toEqual(
        expect.arrayContaining([
            '"organisationBackground" must have less than 500 words'
        ])
    );
});
