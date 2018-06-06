/* eslint-env jest */
'use strict';

const { splitPercentages } = require('./ab');

describe('A/B Test Utilities', () => {
    describe('#splitPercentages', () => {
        function assertValues(percentage, aVal, bVal) {
            const example = splitPercentages(percentage);
            expect(example.A).toBe(aVal);
            expect(example.B).toBe(bVal);
            expect(example.A + example.B).toBe(1);
        }

        it('should return split percentages from 0 to 1', () => {
            assertValues(50, 0.5, 0.5);
            assertValues(90, 0.1, 0.9);
        });

        it('should handle passing strings', () => {
            assertValues('75', 0.25, 0.75);
        });

        it('should handle passing floats', () => {
            const floatExample = splitPercentages(33.33);
            expect(floatExample.A).toBeCloseTo(0.667, 0.001);
            expect(floatExample.B).toBeCloseTo(0.333, 0.001);
            expect(floatExample.A + floatExample.B).toBe(1);
        });
    });
});
