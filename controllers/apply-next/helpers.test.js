/* eslint-env jest */
'use strict';
const { findNextMatchingStepIndex } = require('./helpers');

describe('findNextMatchingStepIndex', () => {
    const mockSteps = [
        { title: 'Step 1' },
        { title: 'Step 2', matchesCondition: formData => formData.name === 'example' },
        { title: 'Step 3' }
    ];

    it('should return start index if current step matches', () => {
        expect(
            findNextMatchingStepIndex({
                steps: mockSteps,
                startIndex: 0,
                formData: {}
            })
        ).toBe(0);

        expect(
            findNextMatchingStepIndex({
                steps: mockSteps,
                startIndex: 1,
                formData: {
                    name: 'example'
                }
            })
        ).toBe(1);

        expect(
            findNextMatchingStepIndex({
                steps: mockSteps,
                startIndex: 2,
                formData: {}
            })
        ).toBe(2);
    });

    it('should skip steps where conditions do not match', () => {
        expect(
            findNextMatchingStepIndex({
                steps: mockSteps,
                startIndex: 1,
                formData: {}
            })
        ).toBe(2);
    });

    it('should return -1 if start index is greater than the number of steps', () => {
        expect(
            findNextMatchingStepIndex({
                steps: mockSteps,
                startIndex: 5,
                formData: {}
            })
        ).toBe(-1);
    });
});
