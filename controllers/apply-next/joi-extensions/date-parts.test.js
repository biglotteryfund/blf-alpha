/* eslint-env jest */
// @ts-nocheck
'use strict';
const moment = require('moment');
const baseJoi = require('@hapi/joi');
const Joi = baseJoi.extend(require('./date-parts'));

describe('dateParts', () => {
    test('valid date', () => {
        const schema = Joi.dateParts();

        expect(
            Joi.attempt({ day: '1', month: '2', year: '2100' }, schema)
        ).toEqual({ day: 1, month: 2, year: 2100 });
        expect(Joi.attempt({ day: 1, month: 2, year: 2100 }, schema)).toEqual({
            day: 1,
            month: 2,
            year: 2100
        });

        const missingDay = schema.validate({ month: 2, year: 2100 });
        expect(missingDay.error.message).toBe(
            'child "day" fails because ["day" is required]'
        );

        const missingMonth = schema.validate({ day: 1, year: 2100 });
        expect(missingMonth.error.message).toBe(
            'child "month" fails because ["month" is required]'
        );

        const missingYear = schema.validate({ day: 1, month: 2 });
        expect(missingYear.error.message).toBe(
            'child "year" fails because ["year" is required]'
        );

        const invalidDate = schema.validate({ day: 31, month: 2, year: 2100 });
        expect(invalidDate.error.details[0].type).toBe('any.invalid');
    });

    test('future date', () => {
        const schema = Joi.dateParts().futureDate('2100-01-01');

        const invalidDate = schema.validate({ day: 1, month: 1, year: 2000 });
        expect(invalidDate.error.details[0].type).toBe('dateParts.futureDate');

        const validDate = schema.validate({ day: 1, month: 1, year: 2100 });
        expect(validDate.error).toBeNull();
    });

    test('date of birth', () => {
        const minAge = 18;
        const schema = Joi.dateParts().dob(minAge);

        const now = moment();
        const invalidDate = schema.validate({
            day: now.format('DD'),
            month: now.format('MM'),
            year: now.format('YYYY')
        });
        expect(invalidDate.error.details[0].type).toBe('dateParts.dob');

        const minAgeDt = moment().subtract(minAge, 'years');
        const validDate = schema.validate({
            day: minAgeDt.format('DD'),
            month: minAgeDt.format('MM'),
            year: minAgeDt.format('YYYY')
        });
        expect(validDate.error).toBeNull();
    });
});
