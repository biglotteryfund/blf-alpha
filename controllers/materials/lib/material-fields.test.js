/* eslint-env jest */
'use strict';

const { validate } = require('./material-fields');

function mapMessages(validationResult) {
    return validationResult.messages.map(item => item.msg);
}

test('should validate material fields schema', () => {
    const invalidResult = validate({
        yourEmail: 'notanemail@invalid'
    });

    expect(mapMessages(invalidResult)).toMatchSnapshot();

    const validResult = validate({
        yourName: 'Björk Guðmundsdóttir',
        yourEmail: 'example@example.com',
        yourAddress1: '3 Embassy Drive',
        yourAddress2: '',
        yourTown: 'Birmingham',
        yourCounty: 'West Midlands',
        yourCountry: 'England',
        yourPostcode: 'B15 1TR',
        yourProjectName: 'Example project name',
        yourGrantAmount: 'under10k',
        yourGrantAmountOther: '',
        yourReason: 'other',
        yourReasonOther: 'Other reason'
    });

    expect(validResult.error).toBeUndefined();
});
