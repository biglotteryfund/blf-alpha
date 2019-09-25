/* eslint-env jest */
'use strict';
const RadioField = require('./radio');

test('RadioField', function() {
    const field = new RadioField({
        name: 'example',
        label: 'Radio field',
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
