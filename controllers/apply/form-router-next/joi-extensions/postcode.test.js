/* eslint-env jest */
// @ts-nocheck
'use strict';
const baseJoi = require('@hapi/joi');
const Joi = baseJoi.extend(require('./postcode'));

describe('postcode', () => {
    const validations = [
        { base: 'L27 8XY', expected: true },
        { base: 'NR103EZ', expected: true },
        { base: 'RG45AY', expected: true },
        { base: 'NE69 7AW', expected: true },
        { base: 'SE23 2NF', expected: true },
        { base: 'Definitely wrong', expected: false },
        { base: '12FSSD', expected: false },
        { base: '1A1 1AA', expected: false },
        { base: 'MA1 1AA', expected: true },
        { base: 'EH1 JS', expected: false },
        { base: 'EH1JS', expected: false },
        { base: 'EH 1JS', expected: false },
        { base: 'BT35 8GE', expected: true }
    ];

    test('valid postcodes', () => {
        const schema = Joi.string().postcode();
        validations.forEach(item => {
            if (item.expected === true) {
                expect(Joi.attempt(item.base, schema)).toEqual(item.base);
            } else {
                const invalidPostcode = schema.validate(item.base);
                expect(invalidPostcode.error.message).toContain(
                    'did not seem to be a valid postcode'
                );
            }
        });
    });
});
