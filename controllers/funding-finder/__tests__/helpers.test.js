/* eslint-env jest */
'use strict';
const { reformatQueryString } = require('../helpers');

describe('#reformatQueryString', () => {
    it('should return an empty string if no valid query is passed', () => {
        [null, undefined, ''].forEach(falseyValue => {
            expect(
                reformatQueryString({
                    originalAreaQuery: falseyValue,
                    originalAmountQuery: falseyValue
                })
            ).toBe('');
        });
    });

    it('should return a reformatted query string for each region', () => {
        expect(
            reformatQueryString({
                originalAreaQuery: 'England',
                originalAmountQuery: null
            })
        ).toBe('location=england');

        expect(
            reformatQueryString({
                originalAreaQuery: 'Northern Ireland',
                originalAmountQuery: null
            })
        ).toBe('location=northernIreland');

        expect(
            reformatQueryString({
                originalAreaQuery: 'Scotland',
                originalAmountQuery: null
            })
        ).toBe('location=scotland');

        expect(
            reformatQueryString({
                originalAreaQuery: 'Wales',
                originalAmountQuery: null
            })
        ).toBe('location=wales');
    });

    it('should return an empty string for invalid regions', () => {
        expect(
            reformatQueryString({
                originalAreaQuery: 'Ireland',
                originalAmountQuery: null
            })
        ).toBe('');

        expect(
            reformatQueryString({
                originalAreaQuery: 'Europe',
                originalAmountQuery: null
            })
        ).toBe('');

        expect(
            reformatQueryString({
                originalAreaQuery: 5000,
                originalAmountQuery: null
            })
        ).toBe('');

        expect(
            reformatQueryString({
                originalAreaQuery: 'not a real place',
                originalAmountQuery: null
            })
        ).toBe('');
    });

    it('should return reformatted query string for amounts over 10k', () => {
        expect(
            reformatQueryString({
                originalAreaQuery: null,
                originalAmountQuery: '10001 - 50000'
            })
        ).toBe('min=10000');

        expect(
            reformatQueryString({
                originalAreaQuery: null,
                originalAmountQuery: 'more than 1000000'
            })
        ).toBe('min=10000');

        expect(
            reformatQueryString({
                originalAreaQuery: null,
                originalAmountQuery: 'up to 10000'
            })
        ).toBe('max=10000');

        expect(
            reformatQueryString({
                originalAreaQuery: null,
                originalAmountQuery: 'an imaginary value'
            })
        ).toBe('min=10000');
    });

    it('should return reformatted query string for a mix of area and amount', () => {
        expect(
            reformatQueryString({
                originalAreaQuery: 'England',
                originalAmountQuery: 'up to 10000'
            })
        ).toBe('location=england&max=10000');

        expect(
            reformatQueryString({
                originalAreaQuery: 'Scotland',
                originalAmountQuery: '10001 - 50000'
            })
        ).toBe('location=scotland&min=10000');

        expect(
            reformatQueryString({
                originalAreaQuery: 'Wales',
                originalAmountQuery: 'more than 1000000'
            })
        ).toBe('location=wales&min=10000');
    });
});
