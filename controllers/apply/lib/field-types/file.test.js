/* eslint-env jest */
'use strict';
const FileField = require('./file');

test('FileField', function() {
    const field = new FileField({
        locale: 'en',
        name: 'example',
        label: 'File field'
    });

    expect(field.type).toBe('file');

    field.withValue({
        filename: 'example.pdf',
        size: 13264,
        type: 'application/pdf'
    });
    expect(field.validate().error).toBeNull();
    expect(field.displayValue).toBe('example.pdf (PDF, 13 KB)');

    field.withValue({
        filename: 'example.js',
        size: 13264,
        type: 'application/javascript'
    });
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('"type" must be one of')
    );
});
