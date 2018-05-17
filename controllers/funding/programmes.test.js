/* eslint-env mocha */
'use strict';
const chai = require('chai');
const expect = chai.expect;

const { programmeFilters } = require('./programmes');

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
            it('should filter programmes by England', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByLocation('england'));
                expect(res.map(item => item.content.title)).to.eql(['National Lottery Awards for All England']);
            });

            it('should filter programmes by Northern Ireland', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByLocation('northernIreland'));
                expect(res.map(item => item.content.title)).to.eql(['Empowering Young People']);
            });

            it('should filter programmes by Wales', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByLocation('wales'));
                expect(res.map(item => item.content.title)).to.eql(['People and Places: Large Grants']);
            });

            it('should filter programmes by Scotland', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByLocation('scotland'));
                expect(res.map(item => item.content.title)).to.eql(['Our Place']);
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

        describe('#filterByMaxAmount', () => {
            it('should filter programmes by maximum amount', () => {
                const res = mockProgrammes.filter(programmeFilters.filterByMaxAmount(10000));
                expect(res.map(item => item.content.title)).to.have.members([
                    'National Lottery Awards for All England'
                ]);
            });
        });
    });
});
