/* eslint-env jest */
'use strict';
const baseJoi = require('@hapi/joi');
const Joi = baseJoi.extend(require('./compare-object'));

test('compare equality of two objects by reference', () => {
    const fieldSchema = Joi.object({
        a: Joi.string().required(),
        b: Joi.string().required()
    }).required();

    const schema = Joi.object({
        exampleA: fieldSchema.compare(Joi.ref('exampleB')),
        exampleB: fieldSchema.compare(Joi.ref('exampleA'))
    });

    expect(
        schema.validate({
            exampleA: { a: 'different', b: 'values' },
            exampleB: { a: 'not', b: 'the same' }
        }).error
    ).toBe(null);

    expect(
        schema.validate({
            exampleA: { a: 'these', b: 'match' },
            exampleB: { a: 'these', b: 'match' }
        }).error.message
    ).toContain('Objects must not match');
});
