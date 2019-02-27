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
        expect(findNextMatchingStepIndex(mockSteps, 0, {})).toBe(0);
        expect(
            findNextMatchingStepIndex(mockSteps, 1, {
                name: 'example'
            })
        ).toBe(1);
        expect(findNextMatchingStepIndex(mockSteps, 2, {})).toBe(2);
    });

    it('should skip steps where conditions do not match', () => {
        expect(findNextMatchingStepIndex(mockSteps, 1, {})).toBe(2);
    });

    it('should return -1 if start index is greater than the number of steps', () => {
        expect(findNextMatchingStepIndex(mockSteps, 5, {})).toBe(-1);
    });
});
