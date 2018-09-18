/* eslint-env jest */
'use strict';
const nodemailer = require('nodemailer');

// Mock email secret
process.env.DIGITAL_FUND_DEMO_EMAIL = 'digital@example.com';

const processor = require('../processor');
const form = require('../form-model');
const { flattenFormData, stepsWithValues } = require('../../helpers');

const mockFormData = {
    'step-1': {
        name: 'Example Person',
        email: 'example@example.com',
        'organisation-name': 'Test Organisation',
        'about-your-organisation': 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro, inventore.'
    }
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

        const [customerEmail] = results.map(cleanMailForSnaphot);
        expect(customerEmail.message).toMatchSnapshot();
    });
});
