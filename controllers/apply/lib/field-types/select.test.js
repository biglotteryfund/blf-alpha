/* eslint-env jest */
'use strict';
const SelectField = require('./select');

test('select field', function() {
    const field = new SelectField({
        locale: 'en',
        name: 'example',
        label: 'Example field',
        options: [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
            { label: 'Option 3', value: 'option-3' }
        ]
    });

    expect(field.type).toBe('select');

    field.withValue('option-2');
    expect(field.displayValue).toBe('Option 2');
    expect(field.validate().error).toBeNull();

    field.withValue('bad-option');
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('must be one of')
    );
});

test('select field supports optgroups', function() {
    const field = new SelectField({
        locale: 'en',
        name: 'example',
        label: 'Example field',
        defaultOption: 'Select an option',
        optgroups: [
            {
                label: 'Group 1',
                options: [{ label: 'Option 1', value: 'option-1' }]
            },
            {
                label: 'Group 2',
                options: [{ label: 'Option 2', value: 'option-2' }]
            }
        ]
    });

    expect(field.normalisedOptions).toEqual([
        { label: 'Option 1', value: 'option-1' },
        { label: 'Option 2', value: 'option-2' }
    ]);
});

test('select field options must contain unique values', function() {
    expect(() => {
        new SelectField({
            locale: 'en',
            name: 'example',
            label: 'Example field',
            options: [
                { label: 'Option 1', value: 'duplicate-value' },
                { label: 'Option 2', value: 'duplicate-value' },
                { label: 'Option 3', value: 'option-3' }
            ]
        });
    }).toThrowError('Options must contain unique values');

    expect(() => {
        new SelectField({
            locale: 'en',
            name: 'example',
            label: 'Example field',
            defaultOption: 'Select an option',
            optgroups: [
                {
                    label: 'Group 1',
                    options: [{ label: 'Option 1', value: 'duplicate-value' }]
                },
                {
                    label: 'Group 2',
                    options: [{ label: 'Option 2', value: 'duplicate-value' }]
                }
            ]
        });
    }).toThrowError('Options must contain unique values');
});
