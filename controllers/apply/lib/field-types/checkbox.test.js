/* eslint-env jest */
'use strict';
const CheckboxField = require('./checkbox');

test('CheckboxField', function() {
    const field = new CheckboxField({
        name: 'example',
        label: 'Checkbox field',
        options: [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
            { label: 'Option 3', value: 'option-3' }
        ]
    });

    expect(field.type).toBe('checkbox');

    field.withValue(['option-1', 'option-2']);
    expect(field.displayValue).toBe('Option 1,\nOption 2');
    expect(field.validate().error).toBeNull();

    field.withValue(['bad-option']);
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('must be one of')
    );
});
