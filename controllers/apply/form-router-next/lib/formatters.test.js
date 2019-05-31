/* eslint-env jest */
'use strict';
const { formatterFor } = require('./formatters');

describe('formatters', () => {
    test('radio', () => {
        const field = {
            type: 'radio',
            options: {
                a: { value: 'a', label: 'A' },
                b: { value: 'b', label: 'B' },
                c: { value: 'c', label: 'C' }
            }
        };

        expect(formatterFor(field)('a')).toBe('A');
    });

    test('checkbox', () => {
        const formatter = formatterFor({
            type: 'checkbox',
            options: {
                a: { value: 'a', label: 'A' },
                b: { value: 'b', label: 'B' },
                c: { value: 'c', label: 'C' }
            }
        });

        expect(formatter(['b', 'c'])).toBe('B,\nC');
    });

    test('address', () => {
        const formatter = formatterFor({ type: 'address' });

        const result = formatter({
            line1: 'Apex House, 3 Embassy Drive',
            townCity: 'Birmingham',
            county: 'West Midlands',
            postcode: 'B15 1TR'
        });

        const expected =
            'Apex House, 3 Embassy Drive,\nBirmingham,\nWest Midlands,\nB15 1TR';

        expect(result).toBe(expected);
    });

    test('addressHistory', () => {
        const formatter = formatterFor({ type: 'address-history' });

        const emptyAddress = {
            line1: '',
            townCity: '',
            county: '',
            postcode: ''
        };

        const address = {
            line1: 'Apex House, 3 Embassy Drive',
            townCity: 'Birmingham',
            county: 'West Midlands',
            postcode: 'B15 1TR'
        };

        expect(
            formatter({
                currentAddressMeetsMinimum: 'yes'
            })
        ).toBe('yes');

        expect(
            formatter({
                currentAddressMeetsMinimum: 'yes',
                previousAddress: address
            })
        ).toBe('yes');

        expect(
            formatter({
                currentAddressMeetsMinimum: 'yes',
                previousAddress: emptyAddress
            })
        ).toBe('yes');

        expect(
            formatter({
                currentAddressMeetsMinimum: 'no',
                previousAddress: address
            })
        ).toBe(
            'Apex House, 3 Embassy Drive,\nBirmingham,\nWest Midlands,\nB15 1TR'
        );
    });

    test('date', () => {
        const formatter = formatterFor({ type: 'date' });

        expect(
            formatter({
                day: 31,
                month: 7,
                year: 2100
            })
        ).toBe('31 July, 2100');
    });

    test('date-range', () => {
        const formatter = formatterFor({ type: 'date-range' });

        expect(
            formatter({
                startDate: { day: 31, month: 7, year: 2100 },
                endDate: { day: 31, month: 7, year: 2101 }
            })
        ).toBe('31 July, 2100–31 July, 2101');
    });

    test('day-month', () => {
        const formatter = formatterFor({ type: 'day-month' });

        expect(
            formatter({
                day: 31,
                month: 7
            })
        ).toBe('31st July');
    });

    test('currency', () => {
        const formatter = formatterFor({ type: 'currency' });
        expect(formatter(100.5)).toBe('£100.5');
        expect(formatter(10000)).toBe('£10,000');
    });

    test('budget', () => {
        const formatter = formatterFor({ type: 'budget' });

        const result = formatter([
            { item: 'Example A', cost: 100 },
            { item: 'Example B', cost: 1200 },
            { item: 'Example C', cost: 525 }
        ]);

        const expected = [
            'Example A – £100',
            'Example B – £1,200',
            'Example C – £525',
            'Total: £1,825'
        ].join('\n');

        expect(formatter(result)).toBe(expected);
    });

    test('default', () => {
        const formatter = formatterFor({ type: null });
        expect(formatter('thing')).toBe('thing');
        expect(formatter(Infinity)).toBe('Infinity');
        expect(formatter(100.50001)).toBe('100.50001');
    });
});
