/* eslint-env jest */
'use strict';

const makeOrderText = require('./make-order-text');

test('should make order text for email', () => {
    const items = [
        {
            name: 'Stainless steel plaque',
            code: 'BLF-BR088',
            quantity: 1
        },
        {
            name: 'Vinyl banner (pink)',
            code: 'BIG-BANNP',
            quantity: 1
        },
        {
            name: 'Balloons',
            code: 'BIG-EVBLN',
            quantity: 2
        }
    ];

    const details = {
        yourName: 'Ann Example',
        yourEmail: 'ann@example.com',
        yourAddress1: '1 Plough Place',
        yourAddress2: '',
        yourCounty: '',
        yourTown: 'London',
        yourCountry: 'United Kingdom',
        yourPostcode: 'EC4A 1DE',
        yourProjectName: '',
        yourReason: 'projectOpening',
        yourReasonOther: '',
        yourGrantAmount: 'over10k',
        yourGrantAmountOther: ''
    };

    const orderText = makeOrderText(items, details);
    expect(orderText).toContain(
        '- x1 BLF-BR088 (item: Stainless steel plaque)'
    );
    expect(orderText).toContain('- x1 BIG-BANNP (item: Vinyl banner (pink))');
    expect(orderText).toContain('Name: Ann Example');
    expect(orderText).toContain('Email address: ann@example.com');
    expect(orderText).toContain('Postcode: EC4A 1DE');
});
