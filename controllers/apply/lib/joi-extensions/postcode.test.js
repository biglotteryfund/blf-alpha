/* eslint-env jest */
// @ts-nocheck
'use strict';
const baseJoi = require('@hapi/joi');
const Joi = baseJoi.extend(require('./postcode'));

test('valid postcodes', () => {
    const schema = Joi.string().postcode();
    [
        ['L27 8XY', true],
        ['NR103EZ', true],
        ['RG45AY', true],
        ['NE69 7AW', true],
        ['SE23 2NF', true],
        [' SE23 2NF', true],
        ['SE23 2NF ', true],
        [' SE23 2NF ', true],
        ['Definitely wrong', false],
        ['12FSSD', false],
        ['1A1 1AA', false],
        ['MA1 1AA', true],
        ['EH1 JS', false],
        ['EH1JS', false],
        ['EH 1JS', false],
        ['BT35 8GE', true]
    ].forEach(([postcode, shouldBeValid]) => {
        if (shouldBeValid === true) {
            expect(Joi.attempt(postcode, schema)).toEqual(postcode.trim());
        } else {
            const invalidPostcode = schema.validate(postcode);
            expect(invalidPostcode.error.message).toContain(
                `did not seem to be a valid postcode`
            );
        }
    });
});
