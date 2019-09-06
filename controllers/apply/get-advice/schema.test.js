/* eslint-env jest */
// @ts-nocheck
'use strict';

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
        projectLocation: 'placeholder-location'
    };

    return Object.assign(defaults, overrides);
}

test('minimal valid form', () => {
    const result = validate(mockResponse());
    expect(result.error).toBeNull();

    expect(result.value).toEqual({
        projectCountry: ['england'],
        projectLocation: 'placeholder-location'
    });
});

test('minimal invalid form', () => {
    const result = validate({
        projectCountry: 'invalid-country',
        projectLocation: null
    });

    expect(mapMessages(result)).toEqual([
        '"projectCountry" must be one of [england, scotland, northern-ireland, wales]',
        '"projectLocation" must be a string'
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
