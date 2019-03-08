/* eslint-env jest */
'use strict';
const { Joi } = require('./validators');

describe('dateObject', () => {
    const schema = Joi.dateObject()
        .iso()
        .min('now');

    test('converts date parts to date', () => {
        const validationResult = schema.validate({ day: '1', month: '2', year: '2088' });
        expect(validationResult.value).toBeInstanceOf(Date);
    });

    test('catches missing date parts', () => {
        const { error } = schema.validate({ day: '31', year: '2088' });
        expect(error.name).toBe('ValidationError');
        expect(error.details[0].type).toBe('date.isoDate');
    });

    test('catches invalid dates', () => {
        const { error } = schema.validate({ day: '31', month: '2', year: '2088' });
        expect(error.name).toBe('ValidationError');
        expect(error.details[0].type).toBe('date.isoDate');
    });

    test('supports additional validation chains', () => {
        const { error } = schema.validate('2000-01-01');
        expect(error.name).toBe('ValidationError');
        expect(error.details[0].type).toBe('date.min');
    });

    test('accepts default string values', () => {
        const validationResult = schema.validate('2088-01-01');
        expect(validationResult.value).toBeInstanceOf(Date);
    });
});
