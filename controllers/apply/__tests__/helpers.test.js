/* eslint-env jest */
'use strict';

const { flatMap, head } = require('lodash');
const { flattenFormData, stepWithValues } = require('../helpers');

const getFields = step => flatMap(step.fieldsets, 'fields');

describe('apply helpers', () => {
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

    it('should not mutate data using stepWithValues', () => {
        const fields = [
            {
                name: 'your-idea',
                type: 'textarea',
                isRequired: true,
                label: 'Idea'
            }
        ];

        const step = {
            name: 'Your idea',
            fieldsets: [{ fields }]
        };

        expect(step).toMatchObject(step);

        expect(getFields(step)).toContainEqual(
            expect.objectContaining({
                name: expect.any(String),
                type: expect.any(String),
                isRequired: expect.any(Boolean),
                label: expect.any(String)
            })
        );

        const result = stepWithValues(step, {
            'your-idea': 'Some value'
        });

        expect(result).toMatchObject({
            name: 'Your idea',
            fieldsets: [
                {
                    fields: [
                        {
                            name: 'your-idea',
                            type: 'textarea',
                            isRequired: true,
                            label: 'Idea',
                            value: 'Some value'
                        }
                    ]
                }
            ]
        });

        // Should not mutate original step object
        expect(head(getFields(step))).not.toHaveProperty('value', 'Some value');
    });
});
