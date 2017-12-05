/* eslint-env mocha */
const chai = require('chai');
const expect = chai.expect;

const { splitPercentages } = require('./ab');

describe('A/B Test Utilities', () => {
    describe('#splitPercentages', () => {
        it('Should return split percentages from 0 to 1', () => {
            const example1 = splitPercentages(50);
            expect(example1.A).to.equal(0.5);
            expect(example1.B).to.equal(0.5);

            const example2 = splitPercentages(90);
            expect(example2.A).to.equal(0.1);
            expect(example2.B).to.equal(0.9);
        });

        it('handles passing strings and floats', () => {
            const example1 = splitPercentages('75');
            expect(example1.A).to.equal(0.25);
            expect(example1.B).to.equal(0.75);

            const example2 = splitPercentages(33.33);
            expect(example2.A).to.be.closeTo(0.667, 0.001);
            expect(example2.B).to.be.closeTo(0.333, 0.001);
        });
    });
});
