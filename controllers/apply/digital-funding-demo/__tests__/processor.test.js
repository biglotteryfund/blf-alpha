/* eslint-env jest */
'use strict';
const nodemailer = require('nodemailer');

const processor = require('../processor');
const form = require('../form-model');
const { flattenFormData, stepsWithValues } = require('../../helpers');

const mockFormData = {
    name: 'Example Person',
    email: 'example@example.com',
    'organisation-name': 'Test Organisation',
    'about-your-organisation': 'Test'
};

function cleanMailForSnaphot(info) {
    info.message = info.message
        .toString()
        .replace(/Message-ID: .*\n/, '')
        .replace(/Date: .*\n/, '')
        .replace(/ boundary=.*\n/, '')
        .replace(/----.*\n/gm, '');
    return info;
}

describe('processor', () => {
    it('should create success emails', async () => {
        const mockTransport = nodemailer.createTransport({
            streamTransport: true,
            newline: 'unix',
            buffer: true
        });

        const results = await processor({
            form: form,
            data: flattenFormData(mockFormData),
            stepsWithValues: stepsWithValues(form(1).steps, mockFormData),
            mailTransport: mockTransport
        });

        const [customerEmail, internalEmail] = results.map(cleanMailForSnaphot);

        expect(customerEmail.message).toMatchSnapshot();
        expect(internalEmail.message).toMatchSnapshot();
    });
});
