/* eslint-env jest */
'use strict';
const { validateAssistance } = require('./schema');

test('validate assistance schema', () => {
    const valid = validateAssistance({
        email: 'example@example.com'
    });

    expect(valid.error).toBeUndefined();

    const invalid = validateAssistance({
        email: 'not an email'
    });

    expect(invalid.error.details.map(detail => detail.message)).toEqual([
        '"email" must be a valid email'
    ]);
});
