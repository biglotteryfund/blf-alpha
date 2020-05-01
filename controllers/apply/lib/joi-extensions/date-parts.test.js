/* eslint-env jest */
// @ts-nocheck
'use strict';
const Joi = require('./index');

test('valid date', function () {
    [
        { day: '1', month: '2', year: '2100' },
        { day: 1, month: 2, year: 2100 },
    ].forEach(function (value) {
        expect(Joi.dateParts().validate(value).error).toBeNull();
    });
});

test('missing day', function () {
    const result = Joi.dateParts().validate({ month: 2, year: 2100 });
    expect(result.error.message).toContain('"day" is required');
});

test('missing month', function () {
    const result = Joi.dateParts().validate({ day: 1, year: 2100 });
    expect(result.error.message).toContain('"month" is required');
});

test('missing year', function () {
    const result = Joi.dateParts().validate({ day: 1, month: 2 });
    expect(result.error.message).toContain('"year" is required');
});

test('invalid date', function () {
    const result = Joi.dateParts().validate({ day: 31, month: 2, year: 2100 });
    expect(result.error.message).toContain('contains an invalid value');
});

test('minDate', function () {
    const schema = Joi.dateParts().minDate('2020-10-01');

    const valid = schema.validate({ day: 2, month: 10, year: 2020 });
    expect(valid.error).toBeNull();

    const invalid = schema.validate({ day: 9, month: 1, year: 2020 });
    expect(invalid.error.message).toContain(
        'Date must be on or after 2020-10-01'
    );
});

test('minDateRef', function () {
    const schema = Joi.object({
        dateA: Joi.dateParts(),
        dateB: Joi.dateParts().minDateRef(Joi.ref('dateA')),
    });

    const valid = schema.validate({
        dateA: { day: 2, month: 10, year: 2020 },
        dateB: { day: 2, month: 10, year: 2020 },
    });
    expect(valid.error).toBeNull();

    const invalid = schema.validate({
        dateA: { day: 2, month: 10, year: 2020 },
        dateB: { day: 1, month: 10, year: 2020 },
    });
    expect(invalid.error.message).toContain(
        'Date must be on or after referenced date'
    );
});

test('maxDate', function () {
    const schema = Joi.dateParts().maxDate('2020-10-01');

    const invalid = schema.validate({ day: 2, month: 10, year: 2020 });
    expect(invalid.error.message).toContain(
        'Date must be on or before 2020-10-01'
    );
});

test('rangeLimit', function () {
    const schema = Joi.object({
        dateA: Joi.dateParts(),
        dateB: Joi.dateParts().rangeLimit(Joi.ref('dateA'), {
            amount: 7,
            unit: 'days',
        }),
    });

    const valid = schema.validate({
        dateA: { day: 2, month: 10, year: 2020 },
        dateB: { day: 9, month: 10, year: 2020 },
    });
    expect(valid.error).toBeNull();

    const invalid = schema.validate({
        dateA: { day: 2, month: 10, year: 2020 },
        dateB: { day: 10, month: 10, year: 2020 },
    });
    expect(invalid.error.message).toContain('Date must be within range');
});
