/* eslint-env jest */
'use strict';
const { getValidLocation, programmeFilters } = require('../helpers');

const mockProgrammes = [
    {
        title: 'National Lottery Awards for All England',
        linkUrl: '/funding/programmes/national-lottery-awards-for-all-england',
        description: '<p>A quick and simple way to get small National Lottery grants of between £300 and £10,000.</p>',
        area: {
            label: 'England',
            value: 'england'
        },
        fundingSize: {
            minimum: 300,
            maximum: 10000,
            totalAvailable: null,
            description: null
        },
        applicationDeadline: '<p>Ongoing</p>',
        organisationType: 'Voluntary or community organisations'
    },
    {
        title: 'Empowering Young People',
        linkUrl: '/funding/programmes/empowering-young-people',
        description:
            '<p>Empowering Young People is a grants programme designed to support projects in Northern Ireland that give young people aged 8 to 25 the ability to overcome the challenges they face.</p>',
        area: {
            label: 'Northern Ireland',
            value: 'northernIreland'
        },
        fundingSize: {
            minimum: 10000,
            maximum: 50000,
            totalAvailable: null,
            description: null
        },
        applicationDeadline: '<p>31 March 2021</p>',
        organisationType: 'Voluntary or community organisations'
    },
    {
        title: 'People and Places: Large grants',
        linkUrl: '/funding/programmes/people-and-places-large-grants',
        description: '<p>Funding capital and revenue community projects from £100,001 to £500,000.</p>',
        area: {
            label: 'Wales',
            value: 'wales'
        },
        fundingSize: {
            minimum: 100001,
            maximum: 500000,
            totalAvailable: 'Up to £15 million each year through both strands of the People and Places programme',
            description: null
        },
        applicationDeadline: '<p>Ongoing</p>',
        organisationType: 'Voluntary or community organisations, Public sector organisations'
    },
    {
        title: 'Our Place',
        linkUrl: '/funding/programmes/our-place',
        description:
            '<p>Helping communities in Scotland come together to find and develop ways in which they can make a difference.</p>',
        area: {
            label: 'Scotland',
            value: 'scotland'
        },
        fundingSize: {
            minimum: 10000,
            maximum: 1000000,
            totalAvailable: '£12 million',
            description: null
        },
        applicationDeadline: '<p>Ongoing up to summer 2018</p>',
        organisationType: null
    },
    {
        title: 'Digital Fund',
        linkUrl: '/funding/programmes/digital-fund',
        description:
            '<p>The Digital Fund is a new UK wide £15 million funding programme to support charities and community organisations. It is about helping the charity and voluntary sector to use digital tools and approaches to support people and communities to thrive.<br /></p>',
        area: {
            label: 'UK-wide',
            value: 'ukWide'
        },
        fundingSize: {
            minimum: null,
            maximum: null,
            totalAvailable: null,
            description: null
        },
        applicationDeadline:
            '<p>Applications initially open on 22nd October 2018 and close on 3rd December 2018. There will be further opportunities to apply in 2019</p>',
        organisationType: null
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
        expect(res.map(item => item.title)).toEqual(['National Lottery Awards for All England']);
    });

    it('should filter programmes by Northern Ireland', () => {
        const res = mockProgrammes.filter(programmeFilters.filterByLocation('northernIreland'));
        expect(res.map(item => item.title)).toEqual(['Empowering Young People']);
    });

    it('should filter programmes by Wales', () => {
        const res = mockProgrammes.filter(programmeFilters.filterByLocation('wales'));
        expect(res.map(item => item.title)).toEqual(['People and Places: Large grants']);
    });

    it('should filter programmes by Scotland', () => {
        const res = mockProgrammes.filter(programmeFilters.filterByLocation('scotland'));
        expect(res.map(item => item.title)).toEqual(['Our Place']);
    });

    it('should filter programmes by min amount, including programmes with no range', () => {
        const res = mockProgrammes.filter(programmeFilters.filterByMinAmount(10000));
        expect(res.map(item => item.title)).toEqual(
            expect.arrayContaining(['Empowering Young People', 'People and Places: Large grants', 'Our Place'])
        );
    });

    it('should filter programmes by maximum amount', () => {
        const res = mockProgrammes.filter(programmeFilters.filterByMaxAmount(10000));
        expect(res.map(item => item.title)).toEqual(
            expect.arrayContaining(['National Lottery Awards for All England'])
        );
    });
});
