/* eslint-env jest */
// @ts-nocheck
'use strict';

const schema = require('./schema');

function validate(data) {
    const { value, error } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });

    return { value, error };
}

test('require one or more countries to be selected', () => {
    const validSingle = validate({
        country: 'england'
    });

    expect(validSingle.error).toBeNull();
    expect(validSingle.value).toEqual({ country: ['england'] });

    const validMultiple = validate({
        country: ['england', 'scotland']
    });

    expect(validMultiple.error).toBeNull();
    expect(validMultiple.value).toEqual({ country: ['england', 'scotland'] });

    expect(
        validate({
            country: 'invalid country'
        }).error.message
    ).toContain('"country" must be one of');
});
