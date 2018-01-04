/* eslint-env mocha */
const chai = require('chai');
const expect = chai.expect;

const { normaliseQuery, reformatQueryString } = require('./legacyPages');

describe('Legacy pages', () => {
    describe('#normaliseQuery', () => {
        it('should normalise &amp; encoding in query strings', () => {
            expect(
                normaliseQuery({
                    area: 'England',
                    'amp;amount': '10001 - 50000',
                    'amp;org': 'Voluntary or community organisation',
                    'amp;sc': '1'
                })
            ).to.eql({
                area: 'England',
                amount: '10001 - 50000',
                org: 'Voluntary or community organisation',
                sc: '1'
            });
        });
    });

    describe('#reformatQueryString', () => {
        it('should return an empty string if no valid query is passed', () => {
            [null, undefined, ''].forEach(falseyValue => {
                expect(
                    reformatQueryString({
                        originalAreaQuery: falseyValue,
                        originalAmountQuery: falseyValue
                    })
                ).to.equal('');
            });
        });

        it('should return a reformatted query string for each region', () => {
            expect(
                reformatQueryString({
                    originalAreaQuery: 'England',
                    originalAmountQuery: null
                })
            ).to.equal('location=england');

            expect(
                reformatQueryString({
                    originalAreaQuery: 'Northern+Ireland',
                    originalAmountQuery: null
                })
            ).to.equal('location=northernIreland');

            expect(
                reformatQueryString({
                    originalAreaQuery: 'Scotland',
                    originalAmountQuery: null
                })
            ).to.equal('location=scotland');

            expect(
                reformatQueryString({
                    originalAreaQuery: 'Wales',
                    originalAmountQuery: null
                })
            ).to.equal('location=wales');
        });

        it('should return an empty string for invalid regions', () => {
            expect(
                reformatQueryString({
                    originalAreaQuery: 'Ireland',
                    originalAmountQuery: null
                })
            ).to.equal('');

            expect(
                reformatQueryString({
                    originalAreaQuery: 'Europe',
                    originalAmountQuery: null
                })
            ).to.equal('');

            expect(
                reformatQueryString({
                    originalAreaQuery: 5000,
                    originalAmountQuery: null
                })
            ).to.equal('');

            expect(
                reformatQueryString({
                    originalAreaQuery: 'not a real place',
                    originalAmountQuery: null
                })
            ).to.equal('');
        });

        it('should return reformatted query string for amounts over 10k', () => {
            expect(
                reformatQueryString({
                    originalAreaQuery: null,
                    originalAmountQuery: '10001 - 50000'
                })
            ).to.equal('min=10000');

            expect(
                reformatQueryString({
                    originalAreaQuery: null,
                    originalAmountQuery: 'more than 1000000'
                })
            ).to.equal('min=10000');

            expect(
                reformatQueryString({
                    originalAreaQuery: null,
                    originalAmountQuery: 'up to 10000'
                })
            ).to.equal('');

            expect(
                reformatQueryString({
                    originalAreaQuery: null,
                    originalAmountQuery: 'an imaginary value'
                })
            ).to.equal('min=10000');
        });

        it('should return reformatted query string for a mix of area and amount', () => {
            expect(
                reformatQueryString({
                    originalAreaQuery: 'England',
                    originalAmountQuery: 'up to 10000'
                })
            ).to.equal('location=england');

            expect(
                reformatQueryString({
                    originalAreaQuery: 'Scotland',
                    originalAmountQuery: '10001 - 50000'
                })
            ).to.equal('location=scotland&min=10000');

            expect(
                reformatQueryString({
                    originalAreaQuery: 'Wales',
                    originalAmountQuery: 'more than 1000000'
                })
            ).to.equal('location=wales&min=10000');
        });
    });
});
