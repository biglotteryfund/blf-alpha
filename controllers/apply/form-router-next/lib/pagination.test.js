/* eslint-env jest */
'use strict';
const pagination = require('./pagination');

describe('pagination', () => {
    const mockSections = [
        {
            slug: 'section-a',
            steps: [
                { title: 'Step 1', isRequired: true },
                { title: 'Step 2', isRequired: true },
                { title: 'Step 3', isRequired: true },
                { title: 'Step 4', isRequired: true }
            ]
        },
        {
            slug: 'section-b',
            introduction: 'This step has an introduction screen',
            steps: [
                { title: 'Step 1', isRequired: true },
                { title: 'Step 2', isRequired: false },
                { title: 'Step 3', isRequired: true }
            ]
        },
        {
            slug: 'section-c',
            steps: [
                { title: 'Step 1', isRequired: true },
                { title: 'Step 2', isRequired: true }
            ]
        }
    ];

    test('first step', () => {
        const { nextUrl, previousUrl } = pagination({
            baseUrl: '/example',
            sections: mockSections,
            sectionSlug: 'section-a',
            currentStepIndex: 0
        });
        expect(nextUrl).toBe('/example/section-a/2');
        expect(previousUrl).toBe('/example');
    });

    test('next section', () => {
        const { nextUrl, previousUrl } = pagination({
            baseUrl: '/example',
            sections: mockSections,
            sectionSlug: 'section-a',
            currentStepIndex: 3
        });
        expect(nextUrl).toBe('/example/section-b');
        expect(previousUrl).toBe('/example/section-a/3');
    });

    test('previous section', () => {
        const { nextUrl, previousUrl } = pagination({
            baseUrl: '/example',
            sections: mockSections,
            sectionSlug: 'section-c',
            currentStepIndex: 0
        });
        expect(nextUrl).toBe('/example/section-c/2');
        expect(previousUrl).toBe('/example/section-b/3');
    });

    test('last step', () => {
        const { nextUrl, previousUrl } = pagination({
            baseUrl: '/example',
            sections: mockSections,
            sectionSlug: 'section-c',
            currentStepIndex: 2
        });
        expect(nextUrl).toBe('/example/summary');
        expect(previousUrl).toBe('/example/section-c/2');
    });

    test('skips conditional steps', () => {
        const { nextUrl, previousUrl } = pagination({
            baseUrl: '/example',
            sections: mockSections,
            sectionSlug: 'section-b',
            currentStepIndex: 0
        });
        expect(nextUrl).toBe('/example/section-b/3');
        expect(previousUrl).toBe('/example/section-b');
    });
});
