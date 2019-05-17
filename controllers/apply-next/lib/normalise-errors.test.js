/* eslint-env jest */
'use strict';

const Joi = require('@hapi/joi');
const normaliseErrors = require('./normalise-errors');

const mockSchema = Joi.object({
    a: Joi.string()
        .min(10)
        .invalid(Joi.ref('b'))
        .required(),
    b: Joi.string()
        .min(12)
        .required(),
    c: Joi.string().required()
});

const mockErrorMessages = {
    a: [
        { type: 'base', message: 'Please enter A' },
        { type: 'string.min', message: 'A must be at least 10 characters' },
        { type: 'any.invalid', message: 'A must not be the same as B' }
    ],
    b: [{ type: 'base', message: 'Please enter B' }]
};

describe('normaliseErrors', () => {
    test('normalise errors', () => {
        const { error } = mockSchema.validate(
            { a: 'tooshort', c: 'here' },
            { abortEarly: false }
        );

        const normalised = normaliseErrors({
            errorDetails: error.details,
            errorMessages: mockErrorMessages
        });

        expect(normalised).toEqual([
            { param: 'b', msg: 'Please enter B' },
            { param: 'a', msg: 'A must be at least 10 characters' }
        ]);
    });

    test('returns first error per field', () => {
        const { error } = mockSchema.validate(
            { a: 'same', b: 'same', c: 'here' },
            { abortEarly: false }
        );

        const normalised = normaliseErrors({
            errorDetails: error.details,
            errorMessages: mockErrorMessages
        });

        expect(error.details.length).toBe(3);
        expect(normalised).toEqual([
            { param: 'b', msg: 'Please enter B' },
            { param: 'a', msg: 'A must not be the same as B' }
        ]);
    });
});
