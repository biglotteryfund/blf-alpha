/* eslint-env jest */
'use strict';
const CurrencyField = require('./currency');

test('CurrencyField', function() {
    const field = new CurrencyField({
        name: 'example',
        label: 'Currency field'
    });

    expect(field.type).toBe('currency');

    field.withValue('120,000');

    expect(field.validate().error).toBeNull();
    expect(field.validate().value).toBe(120000);
    expect(field.displayValue).toBe('£120,000');
});
