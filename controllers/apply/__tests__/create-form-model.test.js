/* eslint-env jest */
'use strict';

const { head } = require('lodash');
const { createStep } = require('../create-form-model');

describe.only('createStep', () => {
    it('should not mutate step with values', () => {
        const fields = [
            {
                name: 'your-idea',
                type: 'textarea',
                isRequired: true,
                label: 'Idea'
            }
        ];

        const schema = {
            name: 'Your idea',
            fieldsets: [{ fields }]
        };

        const step = createStep(schema);

        expect(step).toMatchObject(schema);

        expect(step.getFields()).toContainEqual(
            expect.objectContaining({
                name: expect.any(String),
                type: expect.any(String),
                isRequired: expect.any(Boolean),
                label: expect.any(String)
            })
        );

        const stepWithValues = step.withValues({
            'your-idea': 'Some value'
        });

        expect(stepWithValues).toMatchObject({
            name: 'Your idea',
            fieldsets: [
                {
                    fields: [
                        {
                            name: 'your-idea',
                            type: 'textarea',
                            isRequired: true,
                            label: 'Idea',
                            isConditionalOn: false,
                            isConditionalFor: false,
                            conditionalFor: [],
                            value: 'Some value'
                        }
                    ]
                }
            ]
        });

        // Should not mutate original step object
        expect(head(step.getFields())).not.toHaveProperty('value', 'Some value');
    });
});
