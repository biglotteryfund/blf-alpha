/* eslint-env jest */
// @ts-nocheck
'use strict';
const moment = require('moment');
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

        const endDateBeforeStart = schema.validate({
            startDate: { day: 1, month: 2, year: 2100 },
            endDate: { day: 1, month: 1, year: 2100 }
        });

        expect(endDateBeforeStart.error.message).toContain(
            'endDate must not be before startDate'
        );
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

    test('endDateLimit', () => {
        function toDateParts(dt) {
            return { day: dt.date(), month: dt.month() + 1, year: dt.year() };
        }
        const schema = Joi.dateRange().endDateLimit(12, 'months');

        const dynamicStartDate = moment().add('12', 'weeks');
        const dynamicEndDate = dynamicStartDate.clone().add('12', 'months');

        const valid = schema.validate({
            startDate: toDateParts(dynamicStartDate),
            endDate: toDateParts(dynamicEndDate)
        });

        expect(valid.error).toBeNull();

        const invalid = schema.validate({
            startDate: toDateParts(dynamicStartDate),
            endDate: toDateParts(dynamicEndDate.clone().add('1', 'day'))
        });

        expect(invalid.error.message).toContain('Date is outside limit');
    });
});
