/* eslint-env jest */
'use strict';
const Field = require('./field');
const Joi = require('../joi-extensions');

test('field base type', function() {
    const field = new Field({
        name: 'example',
        label: 'Text field'
    });

    expect(field.type).toBe('text');
    expect(field.isRequired).toBeTruthy();

    field.withValue();
    expect(field.validate().error.message).toEqual('"value" is required');
});

test('optional default field', function() {
    const optionalField = new Field({
        name: 'example',
        label: 'Optional text field',
        isRequired: false
    });

    expect(optionalField.isRequired).toBeFalsy();
    expect(optionalField.validate().error).toBeNull();
});

test('field extension', function() {
    class CustomField extends Field {
        defaultAttributes() {
            return { custom: 'true' };
        }
        defaultLabel() {
            return 'Default label';
        }
        defaultSchema() {
            return Joi.number().required();
        }
        defaultMessages() {
            return [{ type: 'base', message: 'Example message' }];
        }
    }

    const minimalField = new CustomField({
        name: 'example'
    });

    expect(minimalField.type).toEqual('text');
    expect(minimalField.label).toEqual('Default label');
    expect(minimalField.messages).toEqual([
        { type: 'base', message: 'Example message' }
    ]);

    minimalField.withValue('something');
    expect(minimalField.validate().error.message).toEqual(
        '"value" must be a number'
    );

    const fieldWithProps = new CustomField({
        name: 'example',
        label: 'Custom label'
    });
    expect(fieldWithProps.label).toEqual('Custom label');
});
