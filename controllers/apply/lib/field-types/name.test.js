/* eslint-env jest */
'use strict';
const NameField = require('./name');

test('NameField', function() {
    const field = new NameField({
        name: 'example',
        label: 'Name field'
    });

    expect(field.type).toBe('full-name');
    field.withValue({ firstName: 'Björk', lastName: 'Guðmundsdóttir' });
    expect(field.displayValue).toBe('Björk Guðmundsdóttir');
});
