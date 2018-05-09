/* eslint-env mocha */
'use strict';
const chai = require('chai');
const expect = chai.expect;

const { makeOrderText, postcodeArea } = require('./materials-helpers');

describe('Materials utilities', () => {
    it('should make order text for email', () => {
        const items = {
            'BLF-BR088': {
                name: 'Stainless steel plaque',
                id: 3,
                quantity: 1
            },
            itemBlocked: false,
            'BIG-BANNP': {
                name: 'Vinyl banner (pink)',
                id: 6,
                quantity: 1
            },
            'BIG-EVBLN': {
                name: 'Balloons',
                id: 8,
                quantity: 2
            }
        };

        const details = {
            yourName: 'Ann Example',
            yourEmail: 'ann@example.com',
            yourAddress1: '1 Plough Place',
            yourAddress2: '',
            yourCounty: '',
            yourTown: 'London',
            yourCountry: 'United Kingdom',
            yourPostcode: 'EC4A 1DE',
            yourProjectName: '',
            yourReason: 'projectOpening',
            yourReasonOther: '',
            yourGrantAmount: 'over10k',
            yourGrantAmountOther: ''
        };

        const orderText = makeOrderText(items, details);
        expect(orderText).to.contain('- x1 BLF-BR088 (item: Stainless steel plaque)');
        expect(orderText).to.contain('- x1 BIG-BANNP (item: Vinyl banner (pink))');
        expect(orderText).to.contain('Name: Ann Example');
        expect(orderText).to.contain('Email address: ann@example.com');
        expect(orderText).to.contain('Postcode: EC4A 1DE');
    });

    it('should extract postcode outcode', () => {
        const toTest = [
            {
                base: 'L27 8XY',
                expected: 'L27'
            },
            {
                base: 'NR10 3EZ',
                expected: 'NR10'
            },
            {
                base: 'RG4 5AY',
                expected: 'RG4'
            },
            {
                base: 'NE69 7AW',
                expected: 'NE69'
            },
            {
                base: 'SE23 2NF',
                expected: 'SE23'
            },
            {
                base: 'BT35 8GE',
                expected: 'BT35'
            },
            {
                base: 'L278XY',
                expected: 'L27'
            },
            {
                base: 'NR103EZ',
                expected: 'NR10'
            },
            {
                base: 'RG45AY',
                expected: 'RG4'
            },
            {
                base: 'NE697AW',
                expected: 'NE69'
            },
            {
                base: 'SE232NF',
                expected: 'SE23'
            },
            {
                base: 'BT358GE',
                expected: 'BT35'
            },
            {
                base: 'AA9A 9AA',
                expected: 'AA9A'
            },
            {
                base: 'A9A 9AA',
                expected: 'A9A'
            },
            {
                base: 'A9 9AA',
                expected: 'A9'
            },
            {
                base: 'A99 9AA',
                expected: 'A99'
            },
            {
                base: 'AA9 9AA',
                expected: 'AA9'
            },
            {
                base: 'AA99 9AA',
                expected: 'AA99'
            },
            {
                base: 'AA9A9AA',
                expected: 'AA9A'
            },
            {
                base: 'A9A9AA',
                expected: 'A9A'
            },
            {
                base: 'A99AA',
                expected: 'A9'
            },
            {
                base: 'A999AA',
                expected: 'A99'
            },
            {
                base: 'AA99AA',
                expected: 'AA9'
            },
            {
                base: 'AA999AA',
                expected: 'AA99'
            }
        ];

        toTest.forEach(entry => {
            expect(postcodeArea(entry.base)).to.equal(entry.expected);
        });
    });
});
