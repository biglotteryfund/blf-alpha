/* eslint-env jest */
'use strict';
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');
const yaml = require('js-yaml');
const { get } = require('lodash');

const processor = require('../processor');
const form = require('../form-model');
const { flattenFormData, stepsWithValues } = require('../../helpers');

const langData = fs.readFileSync(path.resolve(__dirname, '../../../../config/locales/en.yml'), 'utf-8');
const enCopy = yaml.safeLoad(langData);

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
            copy: get(enCopy, form.lang),
            stepsWithValues: stepsWithValues(form.steps, mockFormData),
            mailTransport: mockTransport
        });

        const [customerEmail, internalEmail] = results.map(cleanMailForSnaphot);

        expect(customerEmail.message).toMatchSnapshot();
        expect(internalEmail.message).toMatchSnapshot();
    });
});
