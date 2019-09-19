/* eslint-env jest */
// @ts-nocheck
'use strict';
const baseJoi = require('@hapi/joi');
const Joi = baseJoi.extend(require('./month-year'));

test('valid month-year', () => {
    const schema = Joi.monthYear();

    const valid = schema.validate({ month: '2', year: '2020' });
    expect(valid.value).toEqual({ month: 2, year: 2020 });
    expect(valid.error).toBe(null);

    const missingMonth = schema.validate({ year: 2000 });
    expect(missingMonth.error.message).toContain('"month" is required');

    const missingYear = schema.validate({ month: 2 });
    expect(missingYear.error.message).toContain('"year" is required');

    const invalidDate = schema.validate({ month: 31, year: 2000 });
    expect(invalidDate.error.message).toContain('contains an invalid value');
});

test('four digit year', () => {
    const schema = Joi.monthYear();
    const invalidDate = schema.validate({ month: 3, year: 100 });
    expect(invalidDate.error.message).toContain(
        '"year" must be larger than or equal to'
    );
});

test('date must be in the past', () => {
    const schema = Joi.monthYear().pastDate();
    const invalidDate = schema.validate({ month: 3, year: 2100 });
    expect(invalidDate.error.message).toContain('must be in the past');
});
