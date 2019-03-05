/* eslint-env jest */
'use strict';

const Joi = require('joi');
const { normaliseErrors } = require('../errors');

const mockSchema = Joi.object({
    a: Joi.string()
        .min(10)
        .invalid(Joi.ref('b'))
        .required(),
    b: Joi.string()
        .min(12)
        .required()
});

const mockErrorMessages = {
    a: {
        base: { en: 'Please enter A', cy: '(cy) Please enter A' },
        'string.min': { en: 'A must be at least 10 characters', cy: '(cy) A must be at least 10 characters' },
        'any.invalid': { en: 'A must not be the same as B', cy: '(cy) A must not be the same as B' }
    },
    b: {
        base: { en: 'Please enter B', cy: '(cy) Please enter B' }
    }
};

describe('normaliseErrors', () => {
    test('normalise errors', () => {
        const validationResult = mockSchema.validate({ a: 'tooshort' }, { abortEarly: false });

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
        const validationResult = mockSchema.validate({ a: 'same', b: 'same' }, { abortEarly: false });

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

    test('can filter errors by name', () => {
        const validationResult = mockSchema.validate({}, { abortEarly: false });

        const normalised = normaliseErrors({
            validationError: validationResult.error,
            errorMessages: mockErrorMessages,
            locale: 'en'
        });

        const normalisedFiltered = normaliseErrors({
            validationError: validationResult.error,
            errorMessages: mockErrorMessages,
            locale: 'en',
            fieldNames: ['a']
        });

        expect(normalised).toEqual([{ param: 'b', msg: 'Please enter B' }, { param: 'a', msg: 'Please enter A' }]);
        expect(normalisedFiltered).toEqual([{ param: 'a', msg: 'Please enter A' }]);
    });
});
