/* eslint-env jest */
'use strict';
const Joi = require('./index');

test('dayMonth', function () {
    const schema = Joi.dayMonth();

    const valid = schema.validate({ day: '1', month: '2' });
    expect(valid.value).toEqual({ day: 1, month: 2 });
    expect(valid.error).toBeUndefined();

    const missingDay = schema.validate({ month: 1 });
    expect(missingDay.error.message).toContain('"day" is required');

    const missingMonth = schema.validate({ day: 31 });
    expect(missingMonth.error.message).toContain('"month" is required');

    const invalidDate = schema.validate({ day: 31, month: 2 });
    expect(invalidDate.error.message).toContain('contains an invalid value');
});
