/* eslint-env jest */
// @ts-nocheck
'use strict';
const omit = require('lodash/omit');

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
        projectCosts: '250,000'
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
        projectCosts: 250000
    });
});

test('minimal invalid form', () => {
    const result = validate({
        projectCountry: 'invalid-country',
        projectLocation: null,
        projectCosts: 5000
    });

    expect(mapMessages(result)).toEqual([
        '"projectCountry" must be one of [england, scotland, northern-ireland, wales]',
        '"projectLocation" must be a string',
        '"projectCosts" must be larger than or equal to 10000'
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
