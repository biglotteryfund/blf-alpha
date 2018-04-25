/* eslint-env mocha */
const chai = require('chai');
const expect = chai.expect;

const { postcodeArea } = require('./userData');

describe('User data helpers', () => {
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
