/* eslint-env jest */
// @ts-nocheck
'use strict';
const Joi = require('@hapi/joi');
const validateForm = require('./validate-form');

function mockForm() {
    return {
        schema: Joi.object({
            a: Joi.string()
                .min(10)
                .invalid(Joi.ref('b'))
                .required(),
            b: Joi.string()
                .min(12)
                .required(),
            c: Joi.string().required()
        }),
        messages: {
            a: [
                { type: 'base', message: 'Please enter A' },
                {
                    type: 'string.min',
                    message: 'A must be at least 10 characters'
                },
                { type: 'any.invalid', message: 'A must not be the same as B' }
            ],
            b: [{ type: 'base', message: 'Please enter B' }]
        }
    };
}

describe('validateForm', () => {
    test('validates form', () => {
        const data = {
            a: 'this is valid',
            b: 'as is this value',
            c: 'and so is this'
        };

        const validationResult = validateForm(mockForm(), data);

        expect(validationResult.isValid).toBeTruthy();
        expect(validationResult.value).toEqual(data);
        expect(validationResult.error).toBeNull();
    });

    test('normalise errors', () => {
        const data = {
            a: 'tooshort',
            c: 'this is valid'
        };

        const validationResult = validateForm(mockForm(), data);

        expect(validationResult.isValid).toBeFalsy();
        expect(validationResult.value).toEqual(data);
        expect(validationResult.messages).toEqual([
            { param: 'b', msg: 'Please enter B' },
            { param: 'a', msg: 'A must be at least 10 characters' }
        ]);
    });

    test('returns first error per field', () => {
        const data = {
            a: 'same',
            b: 'same',
            c: 'this is valid'
        };

        const validationResult = validateForm(mockForm(), data);

        expect(validationResult.isValid).toBeFalsy();
        expect(validationResult.error.details.length).toBe(3);
        expect(validationResult.messages).toEqual([
            { param: 'b', msg: 'Please enter B' },
            { param: 'a', msg: 'A must not be the same as B' }
        ]);
    });
});
