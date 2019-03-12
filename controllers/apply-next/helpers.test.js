/* eslint-env jest */
'use strict';
const { dateFromParts, nextAndPrevious } = require('./helpers');

describe('dateFromParts', () => {
    const dt = dateFromParts({ day: 1, month: 2, year: 2000 });
    expect(dt.isValid()).toBeTruthy();
    expect(dt.format('YYYY-MM-DD')).toBe('2000-02-01');

    expect(() => dateFromParts({ day: 1, month: 2 })).toThrow();
});

describe('nextAndPrevious', () => {
    const mockSections = [
        {
            slug: 'section-a',
            steps: [{ title: 'Step 1' }, { title: 'Step 2' }, { title: 'Step 3' }, { title: 'Step 4' }]
        },
        {
            slug: 'section-b',
            steps: [
                { title: 'Step 1' },
                { title: 'Step 2', matchesCondition: formData => formData.name === 'example' },
                { title: 'Step 3' }
            ]
        },
        {
            slug: 'section-c',
            steps: [{ title: 'Step 1' }, { title: 'Step 2' }]
        }
    ];

    test('first step', () => {
        const { nextUrl, previousUrl } = nextAndPrevious({
            baseUrl: '/example',
            sections: mockSections,
            currentSectionIndex: 0,
            currentStepIndex: 0,
            formData: {}
        });
        expect(nextUrl).toBe('/example/section-a/2');
        expect(previousUrl).toBe('/example');
    });

    test('next section', () => {
        const { nextUrl, previousUrl } = nextAndPrevious({
            baseUrl: '/example',
            sections: mockSections,
            currentSectionIndex: 0,
            currentStepIndex: 3,
            formData: {}
        });
        expect(nextUrl).toBe('/example/section-b');
        expect(previousUrl).toBe('/example/section-a/3');
    });

    test('previous section', () => {
        const { nextUrl, previousUrl } = nextAndPrevious({
            baseUrl: '/example',
            sections: mockSections,
            currentSectionIndex: 2,
            currentStepIndex: 0,
            formData: {}
        });
        expect(nextUrl).toBe('/example/section-c/2');
        expect(previousUrl).toBe('/example/section-b/3');
    });

    test('last step', () => {
        const { nextUrl, previousUrl } = nextAndPrevious({
            baseUrl: '/example',
            sections: mockSections,
            currentSectionIndex: 2,
            currentStepIndex: 2,
            formData: {}
        });
        expect(nextUrl).toBe('/example/summary');
        expect(previousUrl).toBe('/example/section-c/2');
    });

    test('skips conditional steps', () => {
        const { nextUrl, previousUrl } = nextAndPrevious({
            baseUrl: '/example',
            sections: mockSections,
            currentSectionIndex: 1,
            currentStepIndex: 0,
            formData: {}
        });
        expect(nextUrl).toBe('/example/section-b/3');
        expect(previousUrl).toBe('/example/section-a/4');
    });

    it('should include steps where matchesCondition is true', () => {
        const { nextUrl, previousUrl } = nextAndPrevious({
            baseUrl: '/example',
            sections: mockSections,
            currentSectionIndex: 1,
            currentStepIndex: 0,
            formData: { name: 'example' }
        });
        expect(nextUrl).toBe('/example/section-b/2');
        expect(previousUrl).toBe('/example/section-a/4');
    });
});
