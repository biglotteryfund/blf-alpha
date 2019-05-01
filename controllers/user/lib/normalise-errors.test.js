/* eslint-env jest */
'use strict';
const Joi = require('joi');
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
        {
            type: 'base',
            message: { en: 'Please enter A', cy: '(cy) Please enter A' }
        },
        {
            type: 'string.min',
            message: { en: 'A must be at least 10 characters', cy: '(cy) A must be at least 10 characters' }
        },
        {
            type: 'any.invalid',
            message: { en: 'A must not be the same as B', cy: '(cy) A must not be the same as B' }
        }
    ],
    b: [
        {
            type: 'base',
            message: { en: 'Please enter B', cy: '(cy) Please enter B' }
        }
    ]
};

describe('normaliseErrors', () => {
    test('normalise errors', () => {
        const validationResult = mockSchema.validate({ a: 'tooshort', c: 'here' }, { abortEarly: false });

        const normalised = normaliseErrors({
            validationError: validationResult.error,
            errorMessages: mockErrorMessages,
            locale: 'cy'
        });

        expect(normalised).toEqual([
            { param: 'b', msg: '(cy) Please enter B' },
            { param: 'a', msg: '(cy) A must be at least 10 characters' }
        ]);
    });

    test('returns first error per field', () => {
        const validationResult = mockSchema.validate({ a: 'same', b: 'same', c: 'here' }, { abortEarly: false });

        const normalised = normaliseErrors({
            validationError: validationResult.error,
            errorMessages: mockErrorMessages,
            locale: 'en'
        });

        expect(validationResult.error.details.length).toBe(3);
        expect(normalised).toEqual([
            { param: 'b', msg: 'Please enter B' },
            { param: 'a', msg: 'A must not be the same as B' }
        ]);
    });
});
