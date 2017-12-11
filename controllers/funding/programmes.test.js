/* eslint-env mocha */
const chai = require('chai');
const expect = chai.expect;

const { programmeFilters, reformatQueryString } = require('./programmes');

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
                expect(programmeFilters.getValidLocation(mockProgrammes, 'northernIreland')).to.equal(
                    'northernIreland'
                );
                expect(programmeFilters.getValidLocation(mockProgrammes, 'england')).to.equal('england');
                expect(programmeFilters.getValidLocation(mockProgrammes, 'nowhere')).to.be.undefined;
            });
        });

        describe('#filterByLocation', () => {
            it('should filter programmes by England, including UK-Wide', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByLocation('england'));
                expect(res.map(item => item.content.title)).to.eql([
                    'National Lottery Awards for All England',
                    'Awards from the UK Portfolio'
                ]);
            });

            it('should filter programmes by Northern Ireland, including UK-Wide', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByLocation('northernIreland'));
                expect(res.map(item => item.content.title)).to.eql([
                    'Empowering Young People',
                    'Awards from the UK Portfolio'
                ]);
            });

            it('should filter programmes by Wales, including UK-Wide', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByLocation('wales'));
                expect(res.map(item => item.content.title)).to.eql([
                    'People and Places: Large Grants',
                    'Awards from the UK Portfolio'
                ]);
            });

            it('should filter programmes by Scotland, including UK-Wide', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByLocation('scotland'));
                expect(res.map(item => item.content.title)).to.eql(['Our Place', 'Awards from the UK Portfolio']);
            });
        });

        describe('#filterByMinAmount', () => {
            it('should filter programmes by min amount, including programmes with no range', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByMinAmount(10000));
                expect(res.map(item => item.content.title)).to.have.members([
                    'Empowering Young People',
                    'People and Places: Large Grants',
                    'Our Place',
                    'Awards from the UK Portfolio'
                ]);
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
