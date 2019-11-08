/* eslint-env jest */
'use strict';
const Joi = require('@hapi/joi16');
const validateSchema = require('./validate-schema');

describe('validate schemas', () => {
    test('should have right error value if validations pass', () => {
        const schema = Joi.object({
            username: Joi.string()
                .email()
                .required()
        });

        const messages = {
            username: [{ type: 'base', message: 'Invalid email' }]
        };

        const validationResult = validateSchema(
            { schema, messages },
            { username: 'test@test.com' }
        );

        // error result used to be null in Joi v15
        expect(validationResult.error).toEqual(undefined);
        expect(validationResult.isValid).toEqual(true);
    });
});
