/* eslint-env jest */
// @ts-nocheck
'use strict';
const baseJoi = require('@hapi/joi');
const Joi = baseJoi.extend(require('./day-month'));

test('valid day-month', () => {
    const schema = Joi.dayMonth();

    const valid = schema.validate({ day: '1', month: '2' });
    expect(valid.value).toEqual({ day: 1, month: 2 });
    expect(valid.error).toBe(null);

    const missingDay = schema.validate({ month: 1 });
    expect(missingDay.error.message).toContain('"day" is required');

    const missingMonth = schema.validate({ day: 31 });
    expect(missingMonth.error.message).toContain('"month" is required');

    const invalidDate = schema.validate({ day: 31, month: 2 });
    expect(invalidDate.error.message).toContain('contains an invalid value');
});
