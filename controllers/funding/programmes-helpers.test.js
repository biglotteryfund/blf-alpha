/* eslint-env jest */
'use strict';

const { programmeFilters, reformatQueryString } = require('./programmes-helpers');

const mockProgrammes = [
    {
        title: 'National Lottery Awards for All England',
        content: {
            title: 'National Lottery Awards for All England',
            area: {
                label: 'England',
                value: 'england'
            },
            fundingSize: {
                minimum: 300,
                maximum: 10000
            }
        }
    },
    {
        title: 'Empowering Young People',
        content: {
            title: 'Empowering Young People',
            area: {
                label: 'Northern Ireland',
                value: 'northernIreland'
            },
            fundingSize: {
                minimum: 30000,
                maximum: 500000
            }
        }
    },
    {
        title: 'People and Places: Large Grants',
        content: {
            title: 'People and Places: Large Grants',
            area: {
                label: 'Wales',
                value: 'wales'
            },
            fundingSize: {
                minimum: 100001,
                maximum: 500000
            }
        }
    },
    {
        title: 'Our Place',
        content: {
            title: 'Our Place',
            area: {
                label: 'Scotland',
                value: 'scotland'
            },
            fundingSize: {
                minimum: 10000,
                maximum: 1000000
            }
        }
    },
    {
        title: 'Awards from the UK Portfolio',
        content: {
            title: 'Awards from the UK Portfolio',
            area: {
                label: 'UK-wide',
                value: 'ukWide'
            }
        }
    }
];

describe('Programme utilities', () => {
    describe('#programmeFilters', () => {
        describe('#getValidLocation', () => {
            it('should only return valid regions', () => {
                expect(programmeFilters.getValidLocation(mockProgrammes, 'northernIreland')).toBe('northernIreland');
                expect(programmeFilters.getValidLocation(mockProgrammes, 'england')).toBe('england');
                expect(programmeFilters.getValidLocation(mockProgrammes, 'nowhere')).toBeUndefined();
            });
        });

        describe('#filterByLocation', () => {
            it('should filter programmes by England', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByLocation('england'));
                expect(res.map(item => item.content.title)).toEqual(['National Lottery Awards for All England']);
            });

            it('should filter programmes by Northern Ireland', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByLocation('northernIreland'));
                expect(res.map(item => item.content.title)).toEqual(['Empowering Young People']);
            });

            it('should filter programmes by Wales', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByLocation('wales'));
                expect(res.map(item => item.content.title)).toEqual(['People and Places: Large Grants']);
            });

            it('should filter programmes by Scotland', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByLocation('scotland'));
                expect(res.map(item => item.content.title)).toEqual(['Our Place']);
            });
        });

        describe('#filterByMinAmount', () => {
            it('should filter programmes by min amount, including programmes with no range', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByMinAmount(10000));
                expect(res.map(item => item.content.title)).toEqual(
                    expect.arrayContaining([
                        'Empowering Young People',
                        'People and Places: Large Grants',
                        'Our Place',
                        'Awards from the UK Portfolio'
                    ])
                );
            });
        });

        describe('#filterByMaxAmount', () => {
            it('should filter programmes by maximum amount', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByMaxAmount(10000));
                expect(res.map(item => item.content.title)).toEqual(
                    expect.arrayContaining(['National Lottery Awards for All England'])
                );
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
});
