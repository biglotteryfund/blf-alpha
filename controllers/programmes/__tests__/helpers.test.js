/* eslint-env jest */
'use strict';
const { getValidLocation, programmeFilters } = require('../helpers');

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

describe('#getValidLocation', () => {
    it('should only return valid regions', () => {
        expect(getValidLocation(mockProgrammes, 'northernIreland')).toBe('northernIreland');
        expect(getValidLocation(mockProgrammes, 'england')).toBe('england');
        expect(getValidLocation(mockProgrammes, 'nowhere')).toBeUndefined();
    });
});

describe('#programmeFilters', () => {
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

    it('should filter programmes by maximum amount', () => {
        const res = mockProgrammes.filter(programmeFilters.filterByMaxAmount(10000));
        expect(res.map(item => item.content.title)).toEqual(
            expect.arrayContaining(['National Lottery Awards for All England'])
        );
    });
});
