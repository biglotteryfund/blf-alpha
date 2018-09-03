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
    it('should work', async () => {
        const transport = nodemailer.createTransport({
            streamTransport: true,
            newline: 'unix',
            buffer: true
        });

        const result = await processor(
            {
                form: form,
                data: flattenFormData(mockFormData),
                stepsWithValues: stepsWithValues(form.steps, mockFormData)
            },
            transport
        );

        const internalEmail = cleanMailForSnaphot(result[0]);
        const externalEmail = cleanMailForSnaphot(result[1]);

        expect(internalEmail.message).toMatchSnapshot();
        expect(externalEmail.message).toMatchSnapshot();
    });
});
