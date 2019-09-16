/* eslint-env jest */
'use strict';
const { validateAssistance } = require('./schema');

function mapMessages(validationResult) {
    return validationResult.error.details.map(detail => {
        return detail.message;
    });
}

test('validate assistance schema', () => {
    const valid = validateAssistance({
        email: 'example@example.com'
    });

    expect(valid.error).toBeNull();

    const invalid = validateAssistance({
        email: 'not an email'
    });

    expect(mapMessages(invalid)).toEqual(['"email" must be a valid email']);
});
