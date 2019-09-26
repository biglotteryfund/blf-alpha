/* eslint-env jest */
'use strict';
const { emailOnly } = require('./account-schemas');
const validateSchema = require('./validate-schema');

describe('validate schemas', () => {
    test('should have right error value if validations pass', () => {
        const validationResult = validateSchema(
            emailOnly(),
            { username: 'test@test.com' }
        );

        // error result used to be null in Joi v15
        expect(validationResult.error).toEqual(undefined);
        expect(validationResult.isValid).toEqual(true);
    });
});
