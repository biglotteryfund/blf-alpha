/* eslint-env jest */
'use strict';

const { flattenFormData } = require('../forms');

describe('Form helpers', () => {
    it('should flatten form data', () => {
        const formData = {
            'step-1': {
                'your-idea': 'Example'
            },
            'step-2': {
                location: 'North East & Cumbria',
                'project-location': 'London'
            },
            'step-3': {
                'organisation-name': 'Test Organisation',
                'additional-organisations': ''
            },
            'step-4': {
                'first-name': 'Example',
                'last-name': 'Name',
                email: 'example@example.com',
                'phone-number': '03454102030'
            }
        };

        const flattenedExpectation = {
            'your-idea': 'Example',
            location: 'North East & Cumbria',
            'project-location': 'London',
            'organisation-name': 'Test Organisation',
            'additional-organisations': '',
            'first-name': 'Example',
            'last-name': 'Name',
            email: 'example@example.com',
            'phone-number': '03454102030'
        };

        const flattened = flattenFormData(formData);

        // Should flatten data as expected
        expect(flattened).toMatchObject(flattenedExpectation);
        // Should not mutate original value
        expect(formData).not.toMatchObject(flattenedExpectation);
    });
});
