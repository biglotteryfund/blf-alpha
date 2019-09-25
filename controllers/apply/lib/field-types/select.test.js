/* eslint-env jest */
'use strict';
const SelectField = require('./select');

test('SelectField', function() {
    const field = new SelectField({
        name: 'example',
        label: 'Checkbox field',
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
