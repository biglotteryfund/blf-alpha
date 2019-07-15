/* eslint-env jest */
// @ts-nocheck
'use strict';
const baseJoi = require('@hapi/joi');
const Joi = baseJoi.extend(require('./date-range'));

describe('dateRange', () => {
    test('valid date range', () => {
        const schema = Joi.dateRange();

        expect(
            schema.validate({
                startDate: { day: 1, month: 2, year: 2100 },
                endDate: { day: 1, month: 2, year: 2100 }
            }).error
        ).toBeNull();

        const bothInvalid = schema.validate({
            startDate: { day: 31, month: 2, year: 2100 },
            endDate: { day: 31, month: 2, year: 2100 }
        });

        expect(bothInvalid.error.message).toContain(
            'Both startDate and endDate are invalid'
        );

        const startDateInvalid = schema.validate({
            startDate: { day: 31, month: 2, year: 2100 },
            endDate: { day: 1, month: 2, year: 2100 }
        });

        expect(startDateInvalid.error.message).toContain('Invalid startDate');

        const endDateInvalid = schema.validate({
            startDate: { day: 1, month: 2, year: 2100 },
            endDate: { day: 31, month: 2, year: 2100 }
        });

        expect(endDateInvalid.error.message).toContain('Invalid endDate');
    });

    test('minDate', () => {
        const schema = Joi.dateRange().minDate('2100-01-01');
        const valid = schema.validate({
            startDate: { day: 1, month: 2, year: 2100 },
            endDate: { day: 1, month: 2, year: 2100 }
        });

        expect(valid.error).toBeNull();

        const invalid = schema.validate({
            startDate: { day: 1, month: 2, year: 2099 },
            endDate: { day: 1, month: 2, year: 2099 }
        });

        expect(invalid.error.message).toContain(
            'Date must be at least 2100-01-01'
        );
    });

    test('maxDate', () => {
        const schema = Joi.dateRange().maxDate('2100-02-28');

        const valid = schema.validate({
            startDate: { day: 1, month: 2, year: 2100 },
            endDate: { day: 7, month: 2, year: 2100 }
        });

        expect(valid.error).toBeNull();

        const invalid = schema.validate({
            startDate: { day: 1, month: 2, year: 2100 },
            endDate: { day: 1, month: 3, year: 2100 }
        });

        expect(invalid.error.message).toContain('Date is outside limit');
    });

    test('futureEndDate', () => {
        const schema = Joi.dateRange().futureEndDate();

        const valid = {
            startDate: { day: 1, month: 2, year: 2100 },
            endDate: { day: 1, month: 2, year: 2100 }
        };

        expect(schema.validate(valid).error).toBeNull();

        const invalid = {
            startDate: { day: 1, month: 2, year: 2100 },
            endDate: { day: 1, month: 1, year: 2100 }
        };
        expect(schema.validate(invalid).error.message).toContain(
            'endDate must not be before startDate'
        );
    });
});
