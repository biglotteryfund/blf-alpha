/* eslint-env jest */
'use strict';
const {
    formatOptions,
    formatAddress,
    formatDate,
    formatDayMonth,
    formatCurrency,
    formatBudget
} = require('./formaters');

describe('formatters', () => {
    test('formatOptions', () => {
        const options = {
            a: { value: 'a', label: 'A' },
            b: { value: 'b', label: 'B' },
            c: { value: 'c', label: 'C' }
        };
        expect(formatOptions(options, 'a')).toBe('A');
        expect(formatOptions(options, ['b', 'c'])).toBe('B, C');
    });

    test('formatAddress', () => {
        expect(
            formatAddress({
                'building-street': 'Apex House, 3 Embassy Drive',
                'town-city': 'Birmingham',
                county: 'West Midlands',
                postcode: 'B15 1TR'
            })
        ).toBe('Apex House, 3 Embassy Drive,\nBirmingham,\nWest Midlands,\nB15 1TR');
    });

    test('formatDate', () => {
        expect(
            formatDate({
                day: 31,
                month: 7,
                year: 2100
            })
        ).toBe('31 July, 2100');
    });

    test('formatDayMonth', () => {
        expect(
            formatDayMonth({
                day: 31,
                month: 7
            })
        ).toBe('31st July');
    });

    test('formatCurrency', () => {
        expect(formatCurrency(100.5)).toBe('£100.5');
        expect(formatCurrency(10000)).toBe('£10,000');
    });

    test('formatBudget', () => {
        expect(
            formatBudget([
                { item: 'Example A', cost: 100 },
                { item: 'Example B', cost: 1200 },
                { item: 'Example C', cost: 525 }
            ])
        ).toBe('Example A – £100\nExample B – £1,200\nExample C – £525\nTotal: £1,825');
    });
});
