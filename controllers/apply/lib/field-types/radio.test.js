/* eslint-env jest */
'use strict';
const RadioField = require('./radio');

test('radio field', function() {
    const field = new RadioField({
        locale: 'en',
        name: 'example',
        label: 'Example field',
        options: [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' }
        ]
    });

    expect(field.type).toBe('radio');

    field.withValue('option-1');
    expect(field.displayValue).toBe('Option 1');
    expect(field.validate().error).toBeNull();

    field.withValue('bad-option');
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('must be one of')
    );
});

test('radio field options must contain unique values', function() {
    expect(() => {
        new RadioField({
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
});
