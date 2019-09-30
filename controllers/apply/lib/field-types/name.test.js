/* eslint-env jest */
'use strict';
const NameField = require('./name');

test('NameField', function() {
    const field = new NameField({
        name: 'example',
        label: 'Name field'
    });

    field.withValue({});
    expect(field.type).toBe('full-name');
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('"firstName" is required')
    );

    field.withValue({ firstName: 'Björk', lastName: 'Guðmundsdóttir' });
    expect(field.displayValue).toBe('Björk Guðmundsdóttir');
});
