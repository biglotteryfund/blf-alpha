/* eslint-env jest */
'use strict';
const programmeFilters = require('./programme-filters');
const mockProgrammes = require('./mock-programmes.json');

test('should filter programmes by England', () => {
    const res = mockProgrammes.filter(
        programmeFilters.filterByLocation('england')
    );
    expect(res.map((item) => item.title)).toEqual([
        'National Lottery Awards for All England',
    ]);
});

test('should filter programmes by Northern Ireland', () => {
    const res = mockProgrammes.filter(
        programmeFilters.filterByLocation('northernIreland')
    );
    expect(res.map((item) => item.title)).toEqual(['Empowering Young People']);
});

test('should filter programmes by Wales', () => {
    const res = mockProgrammes.filter(
        programmeFilters.filterByLocation('wales')
    );
    expect(res.map((item) => item.title)).toEqual([
        'People and Places: Large grants',
    ]);
});

test('should filter programmes by Scotland', () => {
    const res = mockProgrammes.filter(
        programmeFilters.filterByLocation('scotland')
    );
    expect(res.map((item) => item.title)).toEqual(['Our Place']);
});

test('should filter programmes by min amount, including programmes with no range', () => {
    const res = mockProgrammes.filter(
        programmeFilters.filterByMinAmount(10000)
    );
    expect(res.map((item) => item.title)).toEqual(
        expect.arrayContaining([
            'Empowering Young People',
            'People and Places: Large grants',
            'Our Place',
        ])
    );
});

test('should filter programmes by maximum amount', () => {
    const res = mockProgrammes.filter(
        programmeFilters.filterByMaxAmount(10000)
    );
    expect(res.map((item) => item.title)).toEqual(
        expect.arrayContaining(['National Lottery Awards for All England'])
    );
});
