/* eslint-env jest */
'use strict';
const nodemailer = require('nodemailer');

const processor = require('../processor');
const form = require('../form-model');
const { flattenFormData, stepsWithValues } = require('../../helpers');

const mockFormData = {
    'step-1': {
        'your-idea': 'Test idea'
    },
    'step-2': {
        location: 'South West',
        'project-location': 'London'
    },
    'step-3': {
        'organisation-name': 'Test Organisation',
        'additional-organisations': ''
    },
    'step-4': {
        'first-name': 'Example',
        'last-name': 'Person',
        email: 'example@example.com',
        'phone-number': '03454102030'
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
            stepsWithValues: stepsWithValues(form.steps, mockFormData),
            mailTransport: mockTransport
        });

        const [customerEmail, internalEmail] = results.map(cleanMailForSnaphot);

        expect(customerEmail.message).toMatchSnapshot();
        expect(internalEmail.message).toMatchSnapshot();
    });
});
