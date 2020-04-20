/* eslint-env jest */
'use strict';
const Joi = require('./index');

const objectSchema = Joi.object({
    a: Joi.string().required(),
    b: Joi.string().required(),
}).required();

const schema = Joi.object({
    exampleA: objectSchema.compare(Joi.ref('exampleB')),
    exampleB: objectSchema,
});

test('compare equality of values in two objects', () => {
    expect(
        schema.validate({
            exampleA: { a: 'these', b: 'match' },
            exampleB: { a: 'these', b: 'match' },
        }).error.message
    ).toContain('Object values must not match');

    expect(
        schema.validate({
            exampleA: { a: ' cAsE ', b: ' INSensiTive' },
            exampleB: { a: ' caSE   ', b: ' inSeNsiTIVE' },
        }).error.message
    ).toContain('Object values must not match');
});

test('pass-through when reference is not present', function () {
    expect(
        schema.validate({
            exampleA: { a: 'example', b: 'value' },
        }).error.message
    ).toContain(`"exampleB" is required`);
});

test('valid when values do not match', function () {
    expect(
        schema.validate({
            exampleA: { a: 'different', b: 'values' },
            exampleB: { a: 'not', b: 'the same' },
        }).error
    ).toBeUndefined();
});
