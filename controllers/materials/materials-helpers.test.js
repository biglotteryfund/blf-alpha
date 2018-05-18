/* eslint-env mocha */
'use strict';
const chai = require('chai');
const expect = chai.expect;

const { makeOrderText } = require('./materials-helpers');

describe('Materials utilities', () => {
    it('should make order text for email', () => {
        const orderItems = [
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

        const orderDetails = [
            {
                name: 'yourName',
                emailKey: 'Name',
                value: 'Ann Example'
            },
            {
                name: 'yourEmail',
                type: 'email',
                emailKey: 'Email address',
                value: 'ann@example.com'
            },
            {
                name: 'yourAddress1',
                emailKey: 'Address line 1',
                value: '1 Plough Place'
            },
            {
                name: 'yourAddress2',
                emailKey: 'Address line 2',
                value: ''
            },
            {
                name: 'yourTown',
                emailKey: 'Town/city',
                value: 'London'
            },
            {
                name: 'yourCounty',
                emailKey: 'County',
                value: ''
            },
            {
                name: 'yourCountry',
                emailKey: 'Country',
                value: 'United Kingdom'
            },
            {
                name: 'yourPostcode',
                emailKey: 'Postcode',
                value: 'EC4A 1DE'
            },
            {
                name: 'yourProjectName',
                emailKey: 'Project name',
                value: ''
            },
            {
                name: 'yourGrantAmount',
                emailKey: 'Grant amount',
                value: 'other'
            },
            {
                name: 'yourGrantAmountOther',
                emailKey: 'Grant amount (other)',
                value: 'Other grant amount value'
            },
            {
                name: 'yourReason',
                emailKey: 'Order reason',
                value: 'event'
            },
            {
                name: 'yourReasonOther',
                emailKey: 'Order reason (other)',
                value: ''
            }
        ];

        const orderText = makeOrderText(orderItems, orderDetails);
        expect(orderText).to.contain('- x1 BLF-BR088 (item: Stainless steel plaque)');
        expect(orderText).to.contain('- x1 BIG-BANNP (item: Vinyl banner (pink))');
        expect(orderText).to.contain('Name: Ann Example');
        expect(orderText).to.contain('Email address: ann@example.com');
        expect(orderText).to.contain('Postcode: EC4A 1DE');
    });
});
